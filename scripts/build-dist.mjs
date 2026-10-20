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
// Klucz IndexNow (Bing, Yandex, Seznam): plik <klucz>.txt w katalogu głównym, treść = klucz.
const INDEXNOW_KEY = '456ef02acca8746a616f682133147f7c';
const files = new Set(['index.html', '.htaccess', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'favicon.ico', `${INDEXNOW_KEY}.txt`, 'assets/og-image.jpg', 'assets/apple-touch-icon.png', 'assets/css/main.css', 'assets/js/config.js', 'assets/js/main.js']);
for (const m of html.matchAll(/(href|src|srcset|imagesrcset|data-lb-avif|data-lb-jpg)="([^"]+)"/g)) {
  if (m[2].startsWith('data:')) continue; // obrazek wpisany w HTML (np. pusty kadr lightboxa)
  // Przecinki rozdzielają adresy tylko w srcset; w href mogą być częścią adresu (np. link eBilet).
  for (const part of /srcset|^data-lb-(avif|jpg)$/.test(m[1]) ? m[2].split(',') : [m[2]]) {
    const p = part.trim().split(/\s+/)[0].split('?')[0];
    if (p && !/^(https?:|mailto:|#|data:)/.test(p)) files.add(p);
  }
}
for (const m of css.matchAll(/url\((?:'|")?\.\.\/([^)'"]+)/g)) files.add('assets/' + m[1]);
// Adresy z mapy strony i danych strukturalnych (np. zdjęcia dla Google) też muszą trafić na serwer.
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const jsonld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || '';
for (const m of (sitemap + jsonld).matchAll(/https:\/\/padreguilherme\.pl\/([^"<\s?#]+)/g)) files.add(m[1]);

let bytes = 0;
for (const f of [...files].sort()) {
  const src = path.join(root, f);
  await stat(src); // brak pliku = błąd budowania
  await mkdir(path.dirname(path.join(out, f)), { recursive: true });
  await copyFile(src, path.join(out, f));
  bytes += (await stat(src)).size;
}
// Krótki adres /bilety ze statystykami (PHP): skrypt przekierowania, biblioteka, panel /statystyki/.
// Konfiguracja z hasłem panelu (server/_bilety/config.local.php) nie jest w repozytorium; trafia do paczki,
// tylko gdy istnieje. Bez niej paczka nie nadpisze pliku _bilety/config.php już leżącego na serwerze.
for (const [from, to] of [['server/bilety.php', 'bilety.php'], ['server/_bilety/lib.php', '_bilety/lib.php'], ['server/_bilety/.htaccess', '_bilety/.htaccess'],
  ['server/statystyki/index.php', 'statystyki/index.php'], ['server/statystyki/.htaccess', 'statystyki/.htaccess']]) {
  await mkdir(path.dirname(path.join(out, to)), { recursive: true });
  await copyFile(path.join(root, from), path.join(out, to));
  files.add(to);
}
try {
  await copyFile(path.join(root, 'server/_bilety/config.local.php'), path.join(out, '_bilety/config.php'));
  files.add('_bilety/config.php');
} catch { console.log('UWAGA: brak server/_bilety/config.local.php - paczka bez _bilety/config.php (hasło panelu zostaje to z serwera).'); }

// Ikona także w katalogu głównym: część aplikacji (iOS, podglądy linków) pyta o /apple-touch-icon.png bez czytania <link>.
await copyFile(path.join(root, 'assets/apple-touch-icon.png'), path.join(out, 'apple-touch-icon.png'));
files.add('apple-touch-icon.png');
execFileSync('zip', ['-q', '-r', '-X', '../padreguilherme.pl.zip', '.'], { cwd: out });
const zip = (await stat(path.join(root, 'dist/padreguilherme.pl.zip'))).size;
console.log(`OK: dist/padreguilherme.pl — ${files.size} plików, ${(bytes / 1048576).toFixed(1)} MB; zip ${(zip / 1048576).toFixed(1)} MB`);
