// Buduje podgląd strony w formacie strony-artefaktu claude.ai:
// bez <html>/<head>/<body>, fonty z Google Fonts, zasoby jako osobne pliki obok strony.
//   node scripts/build-preview.mjs  -> dist-preview/site/ (+ files.json z listą plików do publikacji)
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-preview/site');
await rm(out, { recursive: true, force: true });
execFileSync('node', [path.join(root, 'scripts/build-html.mjs'), '--preview'], { stdio: 'inherit' });

const full = await readFile(path.join(out, 'index.html'), 'utf8');
const body = full.slice(full.indexOf('<body>') + 6, full.lastIndexOf('</body>'));
const jsonld = (full.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/) || [''])[0];

const page = `<title>Padre Guilherme Atlas Arena</title>
<meta name="description" content="Podgląd strony koncertu Padre Guilherme — 14 lutego 2027, Atlas Arena, Łódź.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Pinyon+Script&family=Saira:wght@500..600&display=swap">
<link rel="stylesheet" href="assets/css/main.css">
<style>.site-header { top: env(safe-area-inset-top, 0px); }</style>
<script src="assets/js/config.js"></script>
<script>document.documentElement.classList.add('js'); setTimeout(function () { if (!window.__pgReady) document.documentElement.classList.remove('js'); }, 3000);</script>
<script src="assets/js/main.js" defer></script>
${jsonld}
${body}`;
await writeFile(path.join(out, 'index.html'), page);

// Zasoby użyte na stronie.
const used = new Set([...page.matchAll(/assets\/[\w\-./]+\.(?:avif|jpg|png|svg|pdf)/g)].map((m) => m[0]));
used.add('assets/js/config.js');
used.add('assets/js/main.js');
for (const f of used) {
  await mkdir(path.dirname(path.join(out, f)), { recursive: true });
  await copyFile(path.join(root, f), path.join(out, f));
}
// CSS bez @font-face (w podglądzie fonty idą z Google Fonts).
const css = (await readFile(path.join(root, 'assets/css/main.css'), 'utf8')).replace(/\/\* ==== Fonty[\s\S]*?(?=\/\* ==== Tokeny)/, '');
await mkdir(path.join(out, 'assets/css'), { recursive: true });
await writeFile(path.join(out, 'assets/css/main.css'), css);
used.add('assets/css/main.css');

const files = [...used].sort();
await writeFile(path.join(root, 'dist-preview/files.json'), JSON.stringify(files, null, 2));
console.log(`OK: dist-preview/site — strona + ${files.length} plików`);
