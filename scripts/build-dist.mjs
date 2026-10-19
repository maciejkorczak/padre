// Paczka produkcyjna do wgrania na serwer (FTP): tylko pliki potrzebne stronie.
//   npm run dist  -> dist/ oraz dist/padreguilherme.pl.zip
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist/padreguilherme.pl');
await rm(path.join(root, 'dist'), { recursive: true, force: true });
execFileSync('node', [path.join(root, 'scripts/build-html.mjs')], { stdio: 'inherit' });

const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'assets/css/main.css'), 'utf8');
const files = new Set(['index.html', '.htaccess', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'assets/og-image.jpg', 'assets/apple-touch-icon.png', 'assets/css/main.css', 'assets/js/config.js', 'assets/js/main.js']);
for (const m of html.matchAll(/(?:href|src|srcset|imagesrcset|data-lb-avif|data-lb-jpg)="([^"]+)"/g)) {
  for (const part of m[1].split(',')) {
    const p = part.trim().split(/\s+/)[0].split('?')[0];
    if (p && !/^(https?:|mailto:|#|data:)/.test(p)) files.add(p);
  }
}
for (const m of css.matchAll(/url\((?:'|")?\.\.\/([^)'"]+)/g)) files.add('assets/' + m[1]);

let bytes = 0;
for (const f of [...files].sort()) {
  const src = path.join(root, f);
  await stat(src); // brak pliku = błąd budowania
  await mkdir(path.dirname(path.join(out, f)), { recursive: true });
  await copyFile(src, path.join(out, f));
  bytes += (await stat(src)).size;
}
execFileSync('zip', ['-q', '-r', '-X', '../padreguilherme.pl.zip', '.'], { cwd: out });
const zip = (await stat(path.join(root, 'dist/padreguilherme.pl.zip'))).size;
console.log(`OK: dist/padreguilherme.pl — ${files.size} plików, ${(bytes / 1048576).toFixed(1)} MB; zip ${(zip / 1048576).toFixed(1)} MB`);
