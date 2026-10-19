// Generuje responsywne warianty zdjęć (AVIF + JPEG) z katalogu source/images
// do assets/img oraz manifest z wymiarami (używany przez scripts/build-html.mjs).
// Uruchomienie: npm run images
import sharp from 'sharp';
import { mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'source/images');
const OUT = path.join(root, 'assets/img');

// Szerokości dobrane do roli zdjęcia na stronie. Większe od oryginału są pomijane.
const PHOTO = [640, 1024, 1600, 2000];
// Zdjęcia na całą szerokość ekranu: na ekranach Retina potrzeba ok. 3000 px.
const FULL = [640, 1024, 1600, 2000, 2560, 3200];
const SPECS = {
  // Hero z oryginału 3981 px (IMG_5125). Nazwa „hero-hd”: poprzednie pliki „hero-*” były z kopii 2400 px.
  'hero-hd': { from: 'hero', widths: [960, 1440, 1920, 2560, 3200] },
  // Osobny kadr na telefon: pion wokół artysty (twarz ok. 56% szerokości kadru).
  'hero-hd-m': { from: 'hero', crop: { left: 1155, top: 0, width: 1990, height: 3185 }, widths: [600, 900, 1200, 1600] },
  artysta: { widths: PHOTO },
  finale: { widths: FULL },
  'love-scena': { widths: FULL },
  media: { widths: PHOTO },
  plan: { widths: [640, 1024, 1440] },
  skytech: { widths: [480, 800, 1200] },
  'skytech-pomaranczowe': { widths: [480, 800, 1200] },
  'skytech-sylwetka': { widths: [480, 800, 1200] },
  'skytech-biale-tlo': { widths: [480, 800, 1200] },
  'skytech-youtube': { widths: [640, 1280] },
  'djmag-top100-2026': { widths: [540, 1080] },
  'galeria-01': { widths: FULL },
  'galeria-02': { widths: [640, 1024, 1440] },
  'galeria-03': { widths: PHOTO },
  'galeria-04': { widths: PHOTO },
  'galeria-05': { widths: PHOTO },
  'galeria-06': { widths: PHOTO },
  'galeria-07': { widths: PHOTO },
};
const POSTER = { widths: [400, 800] };
const TIKTOK = { widths: [270, 540] };

const files = (await readdir(SRC)).filter((f) => f.endsWith('.jpg'));
const sourcesOnly = new Set(Object.values(SPECS).map((s) => s.from).filter(Boolean));
for (const f of files) {
  const name = f.replace(/\.jpg$/, '');
  if (!SPECS[name] && !sourcesOnly.has(name)) SPECS[name] = name.startsWith('plakat-') ? POSTER : name.startsWith('tiktok-') ? TIKTOK : { widths: PHOTO };
}

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const [name, spec] of Object.entries(SPECS)) {
  const srcFile = path.join(SRC, `${spec.from || name}.jpg`);
  let base = sharp(srcFile).rotate();
  if (spec.crop) base = base.extract(spec.crop);
  // Bufor bez strat (raw): wcześniej toBuffer() kodował JPEG drugi raz i tracił szczegóły.
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const decoded = () => sharp(data, { raw: info });
  const meta = { width: info.width, height: info.height };
  const widths = spec.widths.filter((w) => w <= meta.width);
  // Gdy oryginał jest mniejszy niż największa zaplanowana szerokość, dodaj go w pełnym rozmiarze.
  if (spec.widths.some((w) => w > meta.width)) widths.push(meta.width);
  const uniq = [...new Set(widths)].sort((a, b) => a - b);
  const srcTime = (await stat(srcFile)).mtimeMs;
  for (const w of uniq) {
    // Pomija warianty, które już istnieją i są nowsze od oryginału (szybsze przebudowy).
    const fresh = await Promise.all(['avif', 'jpg'].map((ext) => stat(path.join(OUT, `${name}-${w}.${ext}`)).then((st) => st.mtimeMs >= srcTime, () => false)));
    if (fresh.every(Boolean)) continue;
    const img = decoded().resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 60, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    await img.clone().jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(path.join(OUT, `${name}-${w}.jpg`));
  }
  manifest[name] = { w: meta.width, h: meta.height, widths: uniq };
  console.log(name.padEnd(22), `${meta.width}x${meta.height}`, uniq.join(','));
}

await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('OK:', Object.keys(manifest).length, 'zdjęć');
