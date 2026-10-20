// Testy krótkiego adresu /bilety (przekierowanie + statystyki) i panelu /statystyki/.
// Wymaga PHP (CLI). Uruchamia wbudowany serwer PHP na kopii plików w katalogu tymczasowym
// i atrapę GA4 (Measurement Protocol). Nic nie trafia do prawdziwego GA4 ani do repozytorium.
//   node scripts/test-bilety.mjs
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import { mkdtemp, cp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0, total = 0;
const check = (name, ok, detail = '') => { total++; if (!ok) failed++; console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ' - ' + detail : ''}`); };

const dir = await mkdtemp(path.join(os.tmpdir(), 'pg-bilety-'));
await cp(path.join(root, 'server'), dir, { recursive: true });
await rm(path.join(dir, '_bilety/dane'), { recursive: true, force: true });
await rm(path.join(dir, '_bilety/config.local.php'), { force: true });

// Atrapa GA4: zapisuje żądania, /debug odpowiada pustą listą błędów.
const gaHits = [];
const ga = http.createServer((req, res) => {
  let b = ''; req.on('data', (d) => { b += d; }); req.on('end', () => {
    gaHits.push({ url: req.url, headers: req.headers, body: b });
    if (req.url.startsWith('/debug/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"validationMessages":[]}'); } else { res.writeHead(204); res.end(); }
  });
});
await new Promise((r) => ga.listen(0, '127.0.0.1', r));
const PASSWORD = 'test-haslo-panelu-123';
const hash = execFileSync('php', ['-r', 'echo password_hash($argv[1], PASSWORD_DEFAULT);', PASSWORD]).toString();
await writeFile(path.join(dir, '_bilety/config.php'), `<?php return ['panel_hash' => ${JSON.stringify(hash).replace(/\$/g, '\\$')}, 'ga4_endpoint' => 'http://127.0.0.1:${ga.address().port}'];\n`);
// Router zachowuje się jak reguły z .htaccess (/bilety -> bilety.php, /_bilety/ zablokowane).
await writeFile(path.join(dir, 'router.php'), `<?php
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('~^/bilety/?$~i', $p)) { require __DIR__ . '/bilety.php'; return true; }
if (strpos($p, '/_bilety/') === 0) { http_response_code(403); return true; }
if (strpos($p, '/statystyki/') === 0) { chdir(__DIR__ . '/statystyki'); require __DIR__ . '/statystyki/index.php'; return true; }
http_response_code(404); return true;
`);

const port = 18000 + Math.floor(Math.random() * 2000);
const php = spawn('php', ['-S', `127.0.0.1:${port}`, path.join(dir, 'router.php')], { cwd: dir, stdio: 'ignore' });
const BASE = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/x'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }

const UA_IG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0';
const go = (q, headers = {}) => fetch(BASE + q, { redirect: 'manual', headers: { 'User-Agent': UA_IG, ...headers } });
const T = 'https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme?partner=l2lsp';
const F = '#padre-guilherme_155685,1622';

try {
  /* ---------- Przekierowanie ---------- */
  const cases = [
    ['/bilety', `${T}&utm_source=direct${F}`],
    ['/bilety/', `${T}&utm_source=direct${F}`],
    ['/Bilety', `${T}&utm_source=direct${F}`],
    ['/bilety?utm_source=facebook&utm_medium=paid_social&utm_campaign=padre_lodz&utm_content=reel_01&fbclid=IwAR0abc_1-2', `${T}&utm_source=facebook&utm_medium=paid_social&utm_campaign=padre_lodz&utm_content=reel_01&fbclid=IwAR0abc_1-2${F}`],
    ['/bilety?gclid=Cj0K&utm_campaign=walentynki_%C5%82%C3%B3d%C5%BA', `${T}&utm_source=direct&utm_campaign=walentynki_%C5%82%C3%B3d%C5%BA&gclid=Cj0K${F}`],
    ['/bilety?partner=inny&utm_source=&x=1&utm_term=a%0Db', `${T}&utm_source=direct&utm_term=a%20b${F}`],
    ['/bilety?utm_source[]=x&utm_medium=email&ttclid=T1', `${T}&utm_source=direct&utm_medium=email&ttclid=T1${F}`],
  ];
  for (const [q, want] of cases) {
    const r = await go(q);
    check(`Przekierowanie ${q}`, r.status === 302 && r.headers.get('location') === want, `${r.status} ${r.headers.get('location')}`);
  }
  const h = await go('/bilety');
  check('Przekierowanie: bez cache i bez indeksowania, bez ciasteczek', /no-store/.test(h.headers.get('cache-control') || '') && /noindex/.test(h.headers.get('x-robots-tag') || '') && !h.headers.get('set-cookie'));
  await go('/bilety?utm_source=facebook', { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' });
  await go('/bilety', { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/141', 'Sec-Purpose': 'prefetch' });
  await go('/bilety?utm_source=facebook&utm_content=%3Cscript%3Ealert(1)%3C%2Fscript%3E&fbclid=SEKRET123', { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0;]', Referer: 'https://lm.facebook.com/l.php?u=x' });

  /* ---------- Zapis wejść ---------- */
  const files = (await readdir(path.join(dir, '_bilety/dane'))).filter((f) => f.endsWith('.ndjson'));
  const raw = (await Promise.all(files.map((f) => readFile(path.join(dir, '_bilety/dane', f), 'utf8')))).join('');
  const rows = raw.trim().split('\n').map((l) => JSON.parse(l));
  check('Zapis: każde wejście zapisane', rows.length === cases.length + 4, `${rows.length}`);
  check('Zapis: bez IP, user-agenta i wartości identyfikatorów reklam', !/127\.0\.0\.1|Mozilla|SEKRET123|IwAR0abc/.test(raw));
  check('Zapis: robot i podgląd linku oznaczone', rows.some((r) => r.bot === 1 && r.us === 'facebook') && rows.some((r) => r.pre === 1));
  const fb = rows.find((r) => r.app === 'facebook');
  check('Zapis: aplikacja, urządzenie, system, strona odsyłająca, fbclid jako znacznik', fb && fb.dev === 'telefon' && fb.os === 'Android' && fb.ref === 'lm.facebook.com' && fb.fbclid === 1);
  check('Dane niedostępne z internetu', (await go('/_bilety/dane/' + files[0])).status === 403 && (await go('/_bilety/config.php')).status === 403);

  /* ---------- Panel ---------- */
  let cookie = '';
  const panel = async (method = 'GET', body = null, q = '') => {
    const r = await fetch(BASE + '/statystyki/' + q, { method, redirect: 'manual', headers: { Cookie: cookie, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, body: body ? new URLSearchParams(body).toString() : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    return r;
  };
  let r = await panel(); let html = await r.text();
  const csrf = () => (html.match(/name="csrf" value="([^"]+)"/) || [])[1];
  check('Panel: bez logowania pokazuje tylko formularz', r.status === 200 && /name="haslo"/.test(html) && !/Wejścia dziennie/.test(html));
  check('Panel: nagłówki noindex i blokada ramek', /noindex/.test(r.headers.get('x-robots-tag') || '') && (r.headers.get('x-frame-options') || '') === 'DENY');
  r = await panel('POST', { a: 'login', csrf: csrf(), haslo: 'zle' }); html = await r.text();
  check('Panel: złe hasło odrzucone', /Nieprawidłowe hasło/.test(html));
  r = await panel('POST', { a: 'login', csrf: csrf(), haslo: PASSWORD });
  check('Panel: poprawne hasło loguje', r.status === 303);
  r = await panel(); html = await r.text();
  check('Panel: zestawienia i wykres', /Wejścia dziennie/.test(html) && /<svg class="chart"/.test(html) && /Źródło \(utm_source\)/.test(html));
  check('Panel: roboty i podglądy pominięte w liczbie wejść', /roboty 1, podglądy i HEAD 1/.test(html));
  check('Panel: treść z linków jest bezpiecznie wyświetlana (bez wstrzyknięcia HTML)', html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !html.includes('<script>alert(1)'));
  r = await panel('GET', null, '?p=30&eksport=csv'); const csv = Buffer.from(await r.arrayBuffer()).toString('utf8'); // z BOM (Excel)
  check('Panel: eksport CSV', /^﻿data;godzina;utm_source/.test(csv) && csv.trim().split('\n').length === rows.length + 1);
  r = await panel('GET', null, '?p=30&f_us=facebook'); html = await r.text();
  check('Panel: filtr po źródle', /źródło: facebook/.test(html));
  r = await panel('POST', { a: 'ga4_zapisz', csrf: 'zly-token', secret: 'abcDEF123456' });
  r = await panel(); html = await r.text();
  check('Panel: akcja bez tokenu CSRF odrzucona', /status-bad">wyłączone/.test(html));
  await panel('POST', { a: 'ga4_zapisz', csrf: csrf(), secret: 'abcDEF123456' });
  r = await panel(); html = await r.text();
  check('Panel: zapis klucza GA4 włącza wysyłkę', /status-ok">włączone/.test(html));
  await panel('POST', { a: 'ga4_test', csrf: csrf() });
  await panel('POST', { a: 'ga4_wyslij', csrf: csrf() });

  /* ---------- GA4 ---------- */
  const sent = gaHits.filter((x) => x.url.startsWith('/mp/collect')).map((x) => JSON.parse(x.body));
  const ev = sent.filter((b) => b.events[0].name === 'przekierowanie_bilety');
  check('GA4: test z panelu przechodzi przez walidację i wysyłkę', gaHits.some((x) => x.url.startsWith('/debug/mp/collect')) && sent.some((b) => b.events[0].name === 'przekierowanie_bilety_test'));
  check('GA4: wysłane tylko wejścia ludzi (bez robota i podglądu)', ev.length === cases.length + 2, `${ev.length}`);
  check('GA4: losowy client_id dla każdego wejścia, zgody reklamowe „DENIED”', new Set(ev.map((b) => b.client_id)).size === ev.length && ev.every((b) => b.consent.ad_user_data === 'DENIED' && b.non_personalized_ads === true));
  check('GA4: bez IP, user-agenta i wartości fbclid w treści', !gaHits.some((x) => /Mozilla|SEKRET123|IwAR0abc|127\.0\.0\.1/.test(x.body)));
  check('GA4: parametry kampanii w zdarzeniu', ev.some((b) => b.events[0].params.redirect_source === 'facebook' && b.events[0].params.redirect_campaign === 'padre_lodz' && b.events[0].params.redirect_ad_click === 'meta'));
} finally {
  php.kill(); ga.close();
  await rm(dir, { recursive: true, force: true });
}
console.log(`\nWynik: ${total - failed}/${total} testów zaliczonych.`);
process.exit(failed ? 1 : 0);
