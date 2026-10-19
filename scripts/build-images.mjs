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
const SPECS = {
  hero: { widths: [960, 1440, 1920, 2400] },
  // Osobny kadr na telefon: pion wokół artysty (twarz ok. 56% szerokości kadru).
  'hero-m': { from: 'hero', crop: { left: 696, top: 0, width: 1200, height: 1920 }, widths: [600, 900, 1200] },
  artysta: { widths: PHOTO },
  finale: { widths: PHOTO },
  'love-scena': { widths: PHOTO },
  media: { widths: PHOTO },
  plan: { widths: [640, 1024, 1440] },
  skytech: { widths: [480, 800, 1200] },
  'skytech-pomaranczowe': { widths: [480, 800, 1200] },
  'skytech-sylwetka': { widths: [480, 800, 1200] },
  'skytech-biale-tlo': { widths: [480, 800, 1200] },
  'skytech-youtube': { widths: [640, 1280] },
  'djmag-top100-2026': { widths: [540, 1080] },
  'galeria-01': { widths: PHOTO },
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
for (const f of files) {
  const name = f.replace(/\.jpg$/, '');
  if (!SPECS[name]) SPECS[name] = name.startsWith('plakat-') ? POSTER : name.startsWith('tiktok-') ? TIKTOK : { widths: PHOTO };
}

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const [name, spec] of Object.entries(SPECS)) {
  const srcFile = path.join(SRC, `${spec.from || name}.jpg`);
  let base = sharp(srcFile).rotate();
  if (spec.crop) base = base.extract(spec.crop);
  const buf = await base.toBuffer();
  const meta = await sharp(buf).metadata();
  const widths = spec.widths.filter((w) => w <= meta.width);
  // Gdy oryginał jest mniejszy niż największa zaplanowana szerokość, dodaj go w pełnym rozmiarze.
  if (spec.widths.some((w) => w > meta.width)) widths.push(meta.width);
  const uniq = [...new Set(widths)].sort((a, b) => a - b);
  const srcTime = (await stat(srcFile)).mtimeMs;
  for (const w of uniq) {
    // Pomija warianty, które już istnieją i są nowsze od oryginału (szybsze przebudowy).
    const fresh = await Promise.all(['avif', 'jpg'].map((ext) => stat(path.join(OUT, `${name}-${w}.${ext}`)).then((st) => st.mtimeMs >= srcTime, () => false)));
    if (fresh.every(Boolean)) continue;
    const img = sharp(buf).resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    await img.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(path.join(OUT, `${name}-${w}.jpg`));
  }
  manifest[name] = { w: meta.width, h: meta.height, widths: uniq };
  console.log(name.padEnd(22), `${meta.width}x${meta.height}`, uniq.join(','));
}

await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('OK:', Object.keys(manifest).length, 'zdjęć');
