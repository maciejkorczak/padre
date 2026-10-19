// Eksport strony do PDF do prezentacji: każda sekcja na osobnej stronie (widok komputera)
// oraz plansze z widokiem na telefonie. Uruchamia własny serwer statyczny.
//   npm run pdf   -> docs/Padre_Guilherme_Atlas_Arena_strona.pdf
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import http from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'docs/Padre_Guilherme_Atlas_Arena_strona.pdf');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.woff2': 'font/woff2' };

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root)) throw new Error();
    await stat(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch();

// Strona gotowa do zrzutu: wszystkie zdjęcia pobrane, bez animacji wejścia i paralaksy.
async function prepare(page) {
  // Zapisana decyzja o cookies: baner nie zasłania zrzutów.
  await page.addInitScript(() => { try { localStorage.setItem('pg_consent', JSON.stringify({ analytics: false, marketing: false, ts: 1 })); } catch (e) {} });
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-in'));
  });
  // Przewinięcie całej strony wymusza pobranie zdjęć ładowanych leniwie.
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= h; y += 500) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(40); }
  await page.waitForFunction(() => [...document.images].filter((i) => i.getAttribute('src') && !i.closest('[hidden]')).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(600);
}

/* ---------- Komputer: sekcja po sekcji ---------- */
const DSF = 1.5;
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF, reducedMotion: 'reduce' });
const dp = await desk.newPage();
await prepare(dp);
const shots = [];
shots.push(await dp.screenshot({ type: 'jpeg', quality: 84 }));
await dp.evaluate(() => { document.querySelector('[data-header]').style.visibility = 'hidden'; });
const groups = [['#wydarzenie', '#wideo'], ['#djmag'], ['#artysta'], ['#galeria'], ['#wydarzenia'], ['#love'], ['#support'], ['#bilety'], ['#faq'], ['#media'], ['#kup', '.footer']];
for (const [from, to = from] of groups) {
  const clip = await dp.evaluate(([a, b]) => {
    const r1 = document.querySelector(a).getBoundingClientRect();
    const r2 = document.querySelector(b).getBoundingClientRect();
    return { x: 0, y: r1.top + window.scrollY, width: document.documentElement.clientWidth, height: r2.bottom - r1.top };
  }, [from, to]);
  shots.push(await dp.screenshot({ type: 'jpeg', quality: 84, fullPage: true, clip }));
}
await desk.close();

/* ---------- Telefon: plansze z ekranami ---------- */
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const mp = await mob.newPage();
await prepare(mp);
const phone = async () => (await mp.screenshot({ type: 'jpeg', quality: 86 })).toString('base64');
const at = async (sel, offset = 0) => {
  await mp.evaluate(([s, o]) => window.scrollTo({ top: document.querySelector(s).getBoundingClientRect().top + window.scrollY - o, behavior: 'instant' }), [sel, offset]);
  await mp.waitForTimeout(500);
};
const screens = [];
screens.push(['Pierwszy ekran', await phone()]);
await mp.click('[data-nav-toggle]'); await mp.waitForTimeout(400);
screens.push(['Menu', await phone()]);
await mp.keyboard.press('Escape'); await mp.waitForTimeout(300);
await mp.evaluate(() => document.activeElement && document.activeElement.blur());
await at('#wideo', 64);
screens.push(['TikTok', await phone()]);
await at('#djmag', 64); screens.push(['DJ Mag', await phone()]);
await at('#galeria', 64); screens.push(['Galeria', await phone()]);
await at('#bilety', 64); screens.push(['Bilety', await phone()]);
await at('#faq', 64); screens.push(['FAQ', await phone()]);
await at('#kup', 0); screens.push(['Do zobaczenia w Łodzi', await phone()]);
await mob.close();

const board = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: DSF });
await board.goto(BASE + 'index.html', { waitUntil: 'domcontentloaded' }); // fonty z tego samego źródła
for (let i = 0; i < screens.length; i += 4) {
  const four = screens.slice(i, i + 4);
  await board.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${BASE}assets/css/main.css"><style>
    body { margin: 0; width: 1440px; height: 1000px; background: #0D1513; display: flex; flex-direction: column; justify-content: center; }
    .t { padding: 0 72px; } .row { display: flex; justify-content: center; gap: 40px; margin-top: 28px; }
    figure { margin: 0; text-align: center; } img { display: block; width: 290px; height: auto; border-radius: 28px; border: 6px solid #1C2927; box-shadow: 0 24px 60px rgba(0,0,0,.5); }
    figcaption { margin-top: 14px; font-family: Saira, sans-serif; font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: #A5AEAA; }
  </style></head><body>
    <div class="t"><p class="kicker">Wersja na telefon ${i === 0 ? '' : '(cd.)'}</p></div>
    <div class="row">${four.map(([label, b64]) => `<figure><img src="data:image/jpeg;base64,${b64}"><figcaption>${label}</figcaption></figure>`).join('')}</div>
  </body></html>`, { waitUntil: 'networkidle' });
  await board.evaluate(() => document.fonts.ready);
  shots.push(await board.screenshot({ type: 'jpeg', quality: 86 }));
}
await browser.close();
server.close();

/* ---------- PDF ---------- */
const pdf = await PDFDocument.create();
pdf.setTitle('Padre Guilherme — Atlas Arena, Łódź, 14.02.2027 — strona wydarzenia');
pdf.setAuthor('Booking Artist Agency');
pdf.setCreationDate(new Date());
for (const buf of shots) {
  const img = await pdf.embedJpg(buf);
  const w = img.width / DSF, h = img.height / DSF;
  const page = pdf.addPage([w, h]);
  page.drawImage(img, { x: 0, y: 0, width: w, height: h });
}
await writeFile(OUT, await pdf.save());
console.log(`OK: ${path.relative(root, OUT)} — ${shots.length} stron, ${((await stat(OUT)).size / 1024 / 1024).toFixed(1)} MB`);
