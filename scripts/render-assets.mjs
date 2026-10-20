// Renderuje grafikę Open Graph (1200x630) i ikonę apple-touch-icon (180x180) z prawdziwych fontów i zdjęć.
// Wymaga działającego serwera: npm run serve (port 8080).
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.SITE_URL || 'http://localhost:8080/';
const head = `<base href="${BASE}"><link rel="stylesheet" href="assets/css/main.css"><style>html,body{margin:0;overflow:hidden;animation:none!important}*{animation:none!important}</style>`;

const og = `<!doctype html><html><head>${head}</head><body style="width:1200px;height:630px;position:relative;background:#0D1513">
  <img src="assets/img/hero-hd-1440.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% 64%">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(13,21,19,.92) 0%,rgba(13,21,19,.6) 42%,rgba(13,21,19,0) 70%),linear-gradient(180deg,rgba(13,21,19,.2),rgba(13,21,19,0) 40%,rgba(13,21,19,.6))"></div>
  <div style="position:absolute;left:64px;top:70px;width:560px">
    <img src="assets/logo-padre-guilherme.svg" style="width:470px;height:auto">
    <div class="script" style="margin-top:6px;font-size:66px;color:#ECE8E2">Love is My Religion</div>
  </div>
  <div style="position:absolute;left:64px;bottom:64px">
    <div style="font-family:Saira;font-weight:600;font-size:88px;line-height:1;letter-spacing:.03em;color:#ECE8E2">14.02.2027</div>
    <div style="margin-top:12px;font-family:Saira;font-weight:500;font-size:28px;letter-spacing:.22em;text-transform:uppercase;color:#ECE8E2">Atlas Arena <span style="color:#E8834E">|</span> Łódź</div>
  </div>
</body></html>`;

const icon = `<!doctype html><html><head>${head}</head><body style="width:180px;height:180px;background:#0D1513;display:flex;flex-direction:column;align-items:center;justify-content:center">
  <div style="font-family:Saira;font-weight:600;font-size:84px;line-height:1;letter-spacing:.02em;color:#ECE8E2">PG</div>
  <div style="width:84px;height:7px;border-radius:4px;background:#E8834E;margin-top:10px"></div>
</body></html>`;

const browser = await chromium.launch();
for (const [html, w, h, out, fmt] of [[og, 1200, 630, 'assets/og-image.jpg', 'jpg'], [icon, 180, 180, 'assets/apple-touch-icon.png', 'png']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE + 'robots.txt'); // to samo pochodzenie: fonty wymagają CORS
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Brakujące zdjęcie albo logo = błąd (wcześniej skrypt zapisywał grafikę bez zdjęcia artysty).
  const missing = await page.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src));
  if (missing.length) throw new Error(`${out}: nie wczytano ${missing.join(', ')}`);
  const buf = await page.screenshot({ type: 'png' });
  const img = sharp(buf);
  await (fmt === 'jpg' ? img.jpeg({ quality: 86, mozjpeg: true }) : img.png()).toFile(path.join(root, out));
  console.log('OK:', out);
  await page.close();
}
await browser.close();
