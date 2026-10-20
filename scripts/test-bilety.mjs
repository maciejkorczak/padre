// Testy krótkiego adresu /bilety (przekierowanie + statystyki) i panelu /statystyki/.
// Wymaga PHP (CLI). Uruchamia wbudowany serwer PHP na kopii plików w katalogu tymczasowym
// i atrapę GA4 (Measurement Protocol). Nic nie trafia do prawdziwego GA4 ani do repozytorium.
//   node scripts/test-bilety.mjs
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import { mkdtemp, cp, writeFile, readFile, readdir, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0, total = 0;
const check = (name, ok, detail = '') => { total++; if (!ok) failed++; console.log(`${ok ? '✔' : '✘'} ${name}${detail && !ok ? ' - ' + detail : ''}`); };

const dir = await mkdtemp(path.join(os.tmpdir(), 'pg-bilety-'));
await cp(path.join(root, 'server'), dir, { recursive: true });
await rm(path.join(dir, '_bilety/dane'), { recursive: true, force: true });
await rm(path.join(dir, '_bilety/config.local.php'), { force: true });
const DANE = path.join(dir, '_bilety/dane');

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
const writeConfig = (extra = '') => writeFile(path.join(dir, '_bilety/config.php'), `<?php return ['panel_hash' => ${JSON.stringify(hash).replace(/\$/g, '\\$')}, 'ga4_endpoint' => 'http://127.0.0.1:${ga.address().port}'${extra}];\n`);
await writeConfig();
// Router zachowuje się jak reguły z .htaccess (/bilety -> bilety.php, /_bilety/ zablokowane).
await writeFile(path.join(dir, 'router.php'), `<?php
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('~^/bilety/?$~i', $p)) { require __DIR__ . '/bilety.php'; return true; }
if (strpos($p, '/_bilety/') === 0) { http_response_code(403); return true; }
if (strpos($p, '/statystyki/') === 0) { chdir(__DIR__ . '/statystyki'); require __DIR__ . '/statystyki/index.php'; return true; }
http_response_code(404); return true;
`);

// Serwer słucha na wszystkich adresach 127.x, żeby sprawdzić limit logowań z dwóch „różnych” adresów.
const port = 18000 + Math.floor(Math.random() * 2000);
// Bez opcache (zmiany config.php w trakcie testu działają od razu), 4 procesy (test równoległych logowań).
const php = spawn('php', ['-d', 'opcache.enable=0', '-S', `0.0.0.0:${port}`, path.join(dir, 'router.php')], { cwd: dir, stdio: 'ignore', env: { ...process.env, PHP_CLI_SERVER_WORKERS: '4' } });
const BASE = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/x'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }

const UA_IG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0';
const UA_IG_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 Instagram 357.0.0.46.83 Android (34/14; 480dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; pl_PL; 652143265)';
const go = (q, headers = {}, method = 'GET') => fetch(BASE + q, { method, redirect: 'manual', headers: { 'User-Agent': UA_IG, ...headers } });
const T = 'https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme?partner=l2lsp';
const F = '#padre-guilherme_155685,1622';
const LONG = 'IwZXh0bgNhZW0CMTAAAR' + 'a1B2c3D4e5F6g7H8i9J0_-'.repeat(25); // ok. 570 znaków, jak długie fbclid
const readRows = async () => {
  const files = (await readdir(DANE)).filter((f) => /^wejscia-\d{4}-\d{2}\.php$/.test(f));
  const raw = (await Promise.all(files.map((f) => readFile(path.join(DANE, f), 'utf8')))).join('');
  return { files, raw, rows: raw.split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l)) };
};
const phpJson = (code, input) => JSON.parse(execFileSync('php', ['-r', `define('PG_BILETY', 1); include $argv[1]; $in = json_decode(stream_get_contents(STDIN), true); ${code}`, path.join(dir, '_bilety/lib.php')], { input: JSON.stringify(input) }).toString());

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
    ['/bilety?UTM_Source=Instagram&utm_id=120212345&msclkid=M1', `${T}&utm_source=Instagram&utm_id=120212345&msclkid=M1${F}`],
    [`/bilety?utm_source=facebook&fbclid=${LONG}`, `${T}&utm_source=facebook&fbclid=${LONG}${F}`],
    ['/bilety?utm_source=newsletter&utm_content=jan.kowalski%40example.com&utm_term=%2B48%20600%20700%20800&utm_campaign=120212345678901234', `${T}&utm_source=newsletter&utm_campaign=120212345678901234&utm_content=jan.kowalski%40example.com&utm_term=%2B48%20600%20700%20800${F}`],
    ['/bilety?utm_source=csv&utm_content=%3DHYPERLINK(%22http%3A%2F%2Fx%22%3B%22y%22)', `${T}&utm_source=csv&utm_content=%3DHYPERLINK%28%22http%3A%2F%2Fx%22%3B%22y%22%29${F}`],
    ['/bilety?utm_campaign=a&amp;utm_content=b', `${T}&utm_source=direct&utm_campaign=a&utm_content=b${F}`],
    ['/bilety?utm_source=google&utm_medium=cpc&gad_source=1&gad_campaignid=22334455&gclid=G1', `${T}&utm_source=google&utm_medium=cpc&gad_source=1&gad_campaignid=22334455&gclid=G1${F}`],
  ];
  for (const [q, want] of cases) {
    const r = await go(q);
    check(`Przekierowanie ${q.length > 90 ? q.slice(0, 90) + '…' : q}`, r.status === 302 && r.headers.get('location') === want, `${r.status} ${r.headers.get('location')?.slice(0, 200)}`);
  }
  const h = await go('/bilety');
  check('Przekierowanie: bez cache i bez indeksowania, bez ciasteczek, pusta treść', /no-store/.test(h.headers.get('cache-control') || '') && /noindex/.test(h.headers.get('x-robots-tag') || '') && !h.headers.get('set-cookie') && (await h.text()) === '');
  let human = cases.length + 1;
  await go('/bilety?utm_source=facebook', { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' });
  await go('/bilety', { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/141', 'Sec-Purpose': 'prefetch' });
  await go('/bilety?utm_source=head', {}, 'HEAD');
  await go('/bilety?utm_source=post', {}, 'POST');
  await go('/bilety?utm_source=facebook&utm_content=%3Cscript%3Ealert(1)%3C%2Fscript%3E&fbclid=SEKRET123', { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0;]', Referer: 'https://lm.facebook.com/l.php?u=x' });
  await go('/bilety?utm_source=instagram&utm_campaign=android_ig', { 'User-Agent': UA_IG_ANDROID, Referer: 'https://l.instagram.com/' });
  await go('/bilety?utm_source=gpc_test', { 'Sec-GPC': '1' });
  human += 3;
  const sent = 4 + human; // + robot, podgląd, HEAD, POST

  /* ---------- Zapis wejść ---------- */
  const { files, raw, rows } = await readRows();
  check('Zapis: każde wejście zapisane (także robot, podgląd i HEAD, oznaczone)', rows.length === sent, `${rows.length}/${sent}`);
  check('Zapis: pliki danych zaczynają się od blokady PHP i nic nie wyświetlają', files.length > 0 && raw.startsWith('<?php exit; ?>\n') && execFileSync('php', [path.join(DANE, files[0])]).toString() === '');
  check('Zapis: bez IP, user-agenta i wartości identyfikatorów kliknięć', !/127\.0\.0\.1|Mozilla|SEKRET123|IwAR0abc|IwZXh0bg|Cj0K/.test(raw));
  check('Zapis: robot, podgląd, HEAD i POST oznaczone (nie są odwiedzinami)', rows.some((r) => r.bot === 1 && r.us === 'facebook') && rows.some((r) => r.pre === 1) && rows.some((r) => r.head === 1 && r.us === 'head') && rows.some((r) => r.head === 1 && r.us === 'post'));
  const fb = rows.find((r) => r.app === 'facebook');
  check('Zapis: aplikacja, urządzenie, system, strona odsyłająca, fbclid jako znacznik', fb && fb.dev === 'telefon' && fb.os === 'Android' && fb.ref === 'lm.facebook.com' && fb.fbclid === 1);
  const iga = rows.find((r) => r.uc === 'android_ig');
  check('Zapis: Instagram na telefonie z Androidem to telefon (nie tablet)', iga && iga.dev === 'telefon' && iga.app === 'instagram' && iga.ref === 'l.instagram.com', JSON.stringify(iga));
  const nl = rows.find((r) => r.us === 'newsletter');
  check('Zapis: e-mail i telefon usunięte ze statystyk, numer kampanii zostaje', nl && nl.ux === '(usunięto e-mail)' && nl.ut === '(usunięto numer)' && nl.uc === '120212345678901234', JSON.stringify(nl));
  check('Zapis: wartości małymi literami, sygnał „nie śledź” oznaczony', rows.some((r) => r.us === 'instagram' && r.msclkid === 1) && rows.some((r) => r.us === 'gpc_test' && r.gpc === 1));
  check('Dane niedostępne z internetu', (await go('/_bilety/dane/' + files[0])).status === 403 && (await go('/_bilety/config.php')).status === 403 && (await go('/_bilety/lib.php')).status === 403);

  // Rozpoznawanie urządzeń i czyszczenie wartości (bez serwera).
  const uas = {
    'iPhone Safari': ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'telefon', ''],
    'Instagram Android': [UA_IG_ANDROID, 'telefon', 'instagram'],
    'Messenger Android': ['Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230805.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/440.0.0.30.110;]', 'telefon', 'messenger'],
    'Threads Android': ['Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 Barcelona 350.0.0.0 Android (34/14; 450dpi; 1080x2340; samsung)', 'telefon', 'threads'],
    'TikTok Android': ['Mozilla/5.0 (Linux; Android 14; SM-G991B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 musical_ly_2023605030 BytedanceWebview/d8a21c6', 'telefon', 'tiktok'],
    'Tablet z Androidem': ['Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36', 'tablet', ''],
    'iPad w aplikacji': ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0', 'tablet', 'instagram'],
    'Komputer': ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', 'komputer', ''],
    'Telefon CUBOT (nie robot)': ['Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', 'telefon', ''],
    'Googlebot': ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'bot', ''],
    'WhatsApp (podgląd)': ['WhatsApp/2.23.20.0', 'bot', ''],
    'Telegram na Androidzie (człowiek)': ['Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 Telegram-Android/11.2.2 (Google Pixel 8; Android 14; SDK 34; HIGH)', 'telefon', ''],
    'TelegramBot (podgląd)': ['TelegramBot (like TwitterBot)', 'bot', ''],
    'Pusty user-agent': ['', 'bot', ''],
  };
  const cl = phpJson('echo json_encode(array_map("pg_client", $in));', Object.values(uas).map((x) => x[0]));
  const bad = Object.keys(uas).filter((k, i) => cl[i].dev !== uas[k][1] || cl[i].app !== uas[k][2]);
  check('Urządzenia: telefony, tablety, komputery, roboty i aplikacje rozpoznane', bad.length === 0, bad.map((k) => `${k}: ${JSON.stringify(cl[Object.keys(uas).indexOf(k)])}`).join('; '));
  const sv = phpJson('echo json_encode(array_map("pg_stat_value", $in), JSON_UNESCAPED_UNICODE);', ['Reel_01', 'kontakt: a.b@firma.pl', '+48 600-700-800', '600 700 800', '120212345678901234', 'walentynki_2027', 'x'.repeat(300)]);
  check('Wartości do statystyk: małe litery, bez e-maili i telefonów, do 100 znaków', JSON.stringify(sv.slice(0, 6)) === JSON.stringify(['reel_01', 'kontakt: (usunięto e-mail)', '(usunięto numer)', '(usunięto numer)', '120212345678901234', 'walentynki_2027']) && sv[6].length === 100, JSON.stringify(sv.slice(0, 6)));

  // Awaryjnie, bez lib.php: przekierowanie z tymi samymi parametrami, bez zapisu.
  await rename(path.join(dir, '_bilety/lib.php'), path.join(dir, '_bilety/lib.off'));
  const fr = await go('/bilety?utm_source=fb&utm_campaign=c1&fbclid=F1&gclid=G1&x=1');
  await rename(path.join(dir, '_bilety/lib.off'), path.join(dir, '_bilety/lib.php'));
  check('Awaryjnie (bez lib.php): przekierowanie z utm i identyfikatorami kliknięć', fr.status === 302 && fr.headers.get('location') === `${T}&utm_source=fb&utm_campaign=c1&fbclid=F1&gclid=G1${F}`, fr.headers.get('location'));
  check('Awaryjnie: wejście nie zapisane (bez błędu)', (await readRows()).rows.length === sent);

  /* ---------- Panel ---------- */
  const session = (localAddress) => {
    const s = { cookie: '', html: '' };
    s.req = (method = 'GET', body = null, q = '') => new Promise((resolve, reject) => {
      const data = body ? new URLSearchParams(body).toString() : '';
      const rq = http.request({ host: '127.0.0.1', port, path: '/statystyki/' + q, method, localAddress, headers: { Cookie: s.cookie, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } : {}) } }, (res) => {
        const chunks = []; res.on('data', (d) => chunks.push(d)); res.on('end', () => {
          const sc = res.headers['set-cookie']; if (sc) s.cookie = sc[0].split(';')[0];
          const buf = Buffer.concat(chunks); s.html = buf.toString('utf8');
          const t = s.html.match(/name="csrf" value="([^"]+)"/); if (t) s.token = t[1]; // 303 po akcji nie ma treści
          resolve({ status: res.statusCode, headers: res.headers, buf, text: s.html });
        });
      });
      rq.on('error', reject); rq.end(data);
    });
    s.csrf = () => s.token;
    s.login = async (pw) => { await s.req(); return s.req('POST', { a: 'login', csrf: s.csrf(), haslo: pw }); };
    return s;
  };
  const A = session('127.0.0.1');
  let r = await A.req();
  check('Panel: bez logowania pokazuje tylko formularz', r.status === 200 && /name="haslo"/.test(r.text) && !/Wejścia dziennie/.test(r.text));
  check('Panel: nagłówki noindex, bez skryptów, bez osadzania w ramce', /noindex/.test(r.headers['x-robots-tag'] || '') && /script-src 'none'/.test(r.headers['content-security-policy'] || '') && /frame-ancestors 'none'/.test(r.headers['content-security-policy'] || ''));
  const sc0 = (r.headers['set-cookie'] || [])[0] || '';
  check('Panel: ciasteczko sesji tylko dla /statystyki/, HttpOnly, SameSite=Strict', /path=\/statystyki\//i.test(sc0) && /httponly/i.test(sc0) && /samesite=strict/i.test(sc0), sc0);
  r = await A.req('POST', { a: 'login', csrf: A.csrf(), haslo: 'zle' });
  check('Panel: złe hasło odrzucone', /Nieprawidłowe hasło/.test(r.text));
  r = await A.req('POST', { a: 'login', csrf: A.csrf(), haslo: PASSWORD });
  check('Panel: poprawne hasło loguje', r.status === 303);
  r = await A.req();
  check('Panel: zestawienia i wykres', /Wejścia dziennie/.test(r.text) && /<svg class="chart"/.test(r.text) && /Źródło \(utm_source\)/.test(r.text) && /Kampania \(utm_campaign\)/.test(r.text) && /Treść \/ kreacja \(utm_content\)/.test(r.text));
  check('Panel: liczba wejść bez robotów, podglądów, HEAD i POST', new RegExp(`tile hero"><p class="k">[^<]*</p><p class="v">${human}</p>`).test(r.text) && /roboty 1, podglądy linków 3/.test(r.text), (r.text.match(/tile hero.*?<p class="v">(\d+)/) || [])[1]);
  check('Panel: kafel „Dziś” i identyfikatory kliknięć (Meta, Google, TikTok, Microsoft)', new RegExp(`<p class="k">Dziś</p><p class="v">${human}</p>`).test(r.text) && /Meta 3, Google 2, TikTok 1, Microsoft 1/.test(r.text), (r.text.match(/Meta \d+, Google \d+, TikTok \d+, Microsoft \d+/) || [])[0]);
  check('Panel: treść z linków jest bezpiecznie wyświetlana (bez wstrzyknięcia HTML)', r.text.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !r.text.includes('<script>alert(1)'));
  r = await A.req('GET', null, '?p=d30&eksport=csv');
  const csv = r.buf.toString('utf8');
  check('Panel: eksport CSV (wszystkie wejścia, kolumny po polsku)', csv.startsWith('﻿"data";"godzina";"utm_source";"utm_medium";"utm_campaign";"utm_content";"utm_term";"strona_odsylajaca";"aplikacja";"urzadzenie";"system";"identyfikator_klikniecia";"pominiete"') && csv.trim().split('\n').length === sent + 1, `${csv.trim().split('\n').length}`);
  check('Panel: CSV bez formuł i z poprawnym cudzysłowem', csv.includes('"\'=hyperlink(""http://x"";""y"")"') && !/;"=/.test(csv));
  r = await A.req('GET', null, '?p=d30&f_us=facebook');
  check('Panel: filtr po źródle', /źródło: facebook/.test(r.text) && /tile hero"><p class="k">[^<]*<\/p><p class="v">3<\/p>/.test(r.text));
  r = await A.req('GET', null, '?p=wczoraj');
  const yday = r.text;
  r = await A.req('GET', null, '?p=tydz');
  check('Panel: „Wczoraj” (0 wejść) i „Ten tydzień” (wszystkie dzisiejsze)', /tile hero"><p class="k">[^<]*<\/p><p class="v">0<\/p>/.test(yday) && new RegExp(`tile hero"><p class="k">[^<]*</p><p class="v">${human}</p>`).test(r.text) && /aria-current="true">Ten tydzień/.test(r.text));
  r = await A.req('GET', null, '?p=all');
  const allRange = (r.text.match(/tile hero"><p class="k">Wejścia ([\d.]+) - ([\d.]+)</) || []);
  check('Panel: „Wszystko” zaczyna się od pierwszego wejścia (dziś), nie od początku przechowywania', allRange[1] && allRange[1] === allRange[2], allRange[0]);
  check('Panel: zestawienie źródło / medium / kampania / treść z linkami do filtra', /Źródło \/ medium \/ kampania \/ treść/.test(r.text) && /f_us=facebook&amp;f_um=paid_social&amp;f_uc=padre_lodz&amp;f_ux=reel_01/.test(r.text));
  r = await A.req('GET', null, '?od=1900-01-01&do=2999-12-31');
  const minDate = (r.text.match(/name="od" value="([\d-]+)" min="([\d-]+)"/) || []);
  check('Panel: zakres dat ograniczony do przechowywanych danych', r.status === 200 && minDate[1] && minDate[1] === minDate[2]);
  r = await A.req('GET', null, '?b_us=Instagram&b_um=Paid+Social&b_uc=Padre+%C5%81%C3%B3d%C5%BA+2027');
  check('Panel: generator linków (małe litery, bez spacji i polskich znaków, pole do skopiowania)', /<input id="link-gotowy" type="text" readonly value="https:\/\/padreguilherme\.pl\/bilety\?utm_source=instagram&amp;utm_medium=paid_social&amp;utm_campaign=padre_lodz_2027"/.test(r.text));

  // GA4: domyślnie wyłączone; CSRF; zapis klucza; test; wysyłka; wyłączenie.
  check('GA4: domyślnie wyłączone', /status-bad">wyłączone/.test(r.text));
  await A.req('POST', { a: 'ga4_zapisz', csrf: 'zly-token', secret: 'abcDEF123456' });
  r = await A.req();
  check('Panel: akcja bez tokenu CSRF odrzucona', /status-bad">wyłączone/.test(r.text));
  await A.req('POST', { a: 'ga4_zapisz', csrf: A.csrf(), secret: '' });
  r = await A.req();
  check('Panel: pusty klucz GA4 odrzucony z komunikatem', /pole było puste/.test(r.text) && /status-bad">wyłączone/.test(r.text));
  await A.req('POST', { a: 'ga4_zapisz', csrf: A.csrf(), secret: 'abcDEF123456' });
  r = await A.req();
  check('Panel: zapis klucza GA4 włącza wysyłkę od tej chwili (wcześniejsze wejścia nie czekają)', /status-ok">włączone/.test(r.text) && /Czeka na wysyłkę: 0\./.test(r.text) && /od tej chwili/.test(r.text), (r.text.match(/Czeka na wysyłkę: \d+/) || [])[0]);
  const ust = await readFile(path.join(DANE, 'ustawienia.php'), 'utf8');
  check('Ustawienia: plik PHP z blokadą i danymi JSON (bez include), nic nie wyświetla; config.php bez zmian', ust.startsWith('<?php exit; ?>\n') && JSON.parse(ust.split('\n').slice(1).join('\n')).ga4_secret === 'abcDEF123456' && execFileSync('php', [path.join(DANE, 'ustawienia.php')]).toString() === '' && !(await readFile(path.join(dir, '_bilety/config.php'), 'utf8')).includes('abcDEF'));
  // Wejścia po włączeniu: 3 osoby, 1 z sygnałem „nie śledź”, 1 robot.
  await go('/bilety?utm_source=facebook&utm_medium=paid_social&utm_campaign=padre_lodz&utm_content=reel_01&fbclid=IwAR0abc_po');
  await go('/bilety?utm_source=bing&msclkid=M2');
  await go('/bilety');
  await go('/bilety?utm_source=gpc_po', { 'Sec-GPC': '1' });
  await go('/bilety?utm_source=bot_po', { 'User-Agent': 'Googlebot/2.1' });
  r = await A.req();
  check('GA4: czekają tylko wejścia ludzi po włączeniu', /Czeka na wysyłkę: 3\./.test(r.text), (r.text.match(/Czeka na wysyłkę: \d+/) || [])[0]);
  await A.req('POST', { a: 'ga4_test', csrf: A.csrf() });
  await A.req('POST', { a: 'ga4_wyslij', csrf: A.csrf() });
  r = await A.req();
  check('Panel: po wysyłce nic nie czeka', /Czeka na wysyłkę: 0\./.test(r.text), (r.text.match(/Stan:.{0,200}/) || [])[0]);
  await A.req('POST', { a: 'ga4_wyslij', csrf: A.csrf() });

  let mp = gaHits.filter((x) => x.url.startsWith('/mp/collect')).map((x) => JSON.parse(x.body));
  let ev = mp.filter((b) => b.events[0].name === 'przekierowanie_bilety');
  check('GA4: test z panelu przechodzi przez walidację i wysyłkę', gaHits.some((x) => x.url.startsWith('/debug/mp/collect')) && mp.some((b) => b.events[0].name === 'przekierowanie_bilety_test'));
  check('GA4: wysłane tylko 3 wejścia ludzi po włączeniu (bez wcześniejszych, „nie śledź”, robotów i duplikatów)', ev.length === 3 && !ev.some((b) => ['gpc_po', 'bot_po', 'newsletter', 'csv', 'instagram'].includes(b.events[0].params.redirect_source)), ev.map((b) => b.events[0].params.redirect_source).join(','));
  check('GA4: losowy client_id dla każdego wejścia, zgody reklamowe „DENIED”, bez przestarzałego non_personalized_ads', new Set(ev.map((b) => b.client_id)).size === ev.length && ev.every((b) => b.consent.ad_user_data === 'DENIED' && b.consent.ad_personalization === 'DENIED' && !('non_personalized_ads' in b)));
  check('GA4: bez IP, user-agenta i wartości identyfikatorów kliknięć w treści', !gaHits.some((x) => /Mozilla|SEKRET123|IwAR0abc|IwZXh0bg|Cj0K|127\.0\.0\.1|M2"/.test(x.body)));
  check('GA4: parametry kampanii w zdarzeniu', ev.some((b) => { const p = b.events[0].params; return p.redirect_source === 'facebook' && p.redirect_medium === 'paid_social' && p.redirect_campaign === 'padre_lodz' && p.redirect_content === 'reel_01' && p.redirect_click_id === 'meta'; }) && ev.some((b) => b.events[0].params.redirect_click_id === 'microsoft') && ev.some((b) => b.events[0].params.redirect_source === 'direct'));
  await A.req('POST', { a: 'ga4_wylacz', csrf: A.csrf() });
  r = await A.req();
  check('Panel: wyłączenie wysyłki do GA4', /status-bad">wyłączone/.test(r.text) && /Wysyłka do GA4 wyłączona/.test(r.text), (r.text.match(/class="flash[^>]*>[^<]*/) || [])[0]);
  const before = gaHits.length;
  await go('/bilety?utm_source=po_wylaczeniu');
  await A.req('POST', { a: 'ga4_wyslij', csrf: A.csrf() });
  check('GA4: po wyłączeniu nic nie jest wysyłane (od razu, bez czekania)', gaHits.length === before);

  // Limit logowań liczony osobno dla każdego adresu.
  const B = session('127.0.0.2');
  await B.req();
  for (let i = 0; i < 5; i++) await B.req('POST', { a: 'login', csrf: B.csrf(), haslo: 'zle-' + i });
  r = await B.req('POST', { a: 'login', csrf: B.csrf(), haslo: PASSWORD });
  check('Logowanie: po 5 nieudanych próbach blokada (także dla dobrego hasła)', /Za dużo nieudanych prób/.test(r.text) && r.status === 200);
  const C = session('127.0.0.1');
  r = await C.login(PASSWORD);
  check('Logowanie: blokada nie dotyczy innych adresów', r.status === 303);
  // 20 równoległych prób z jednego adresu: limit 5 obowiązuje także wtedy.
  const E = session('127.0.0.3');
  await E.req();
  const par = await Promise.all(Array.from({ length: 20 }, (_, i) => E.req('POST', { a: 'login', csrf: E.csrf(), haslo: 'zle-r' + i })));
  const verified = par.filter((x) => /Nieprawidłowe hasło/.test(x.text)).length;
  check('Logowanie: równoległe próby nie omijają limitu 5', verified <= 5 && par.every((x) => /Nieprawidłowe hasło|Za dużo nieudanych prób/.test(x.text)), `${verified} sprawdzonych haseł`);
  const lj = await readFile(path.join(DANE, 'logowania.php'), 'utf8');
  check('Logowanie: licznik bez adresów IP', !/127\.0\.0\./.test(lj) && lj.startsWith('<?php exit; ?>'));

  // Zmiana hasła wylogowuje inne sesje.
  r = await C.req();
  await C.req('POST', { a: 'haslo', csrf: C.csrf(), stare: PASSWORD, nowe: 'nowe-haslo-panelu-456', nowe2: 'nowe-haslo-panelu-456' });
  r = await C.req();
  check('Hasło: zmiana działa, sesja zmieniającego zostaje', /Hasło zmienione/.test(r.text) && /Wejścia dziennie/.test(r.text));
  r = await A.req();
  check('Hasło: inne zalogowane sesje wylogowane', /name="haslo"/.test(r.text) && !/Wejścia dziennie/.test(r.text));
  const D = session('127.0.0.1');
  check('Hasło: stare nie działa, nowe działa', (await D.login(PASSWORD)).status !== 303 && (await D.login('nowe-haslo-panelu-456')).status === 303);
  await D.req();
  await D.req('POST', { a: 'wyloguj', csrf: D.csrf() });
  r = await D.req();
  check('Panel: wylogowanie', /name="haslo"/.test(r.text));

  /* ---------- Retencja i ochrona przed zalewem ---------- */
  await writeFile(path.join(DANE, 'wejscia-2020-01.php'), '<?php exit; ?>\n{"t":1577880000,"us":"stare"}\n');
  await D.login('nowe-haslo-panelu-456'); await D.req();
  check('Retencja: zapisy starsze niż 14 miesięcy usunięte', !existsSync(path.join(DANE, 'wejscia-2020-01.php')) && (await readRows()).files.length > 0);
  await writeConfig(", 'limit_minuta' => 1");
  for (let i = 0; i < 3; i++) await go('/bilety?utm_source=zalew&utm_campaign=x' + i);
  const fl = (await readRows()).rows.slice(-3);
  await writeConfig(", 'limit_pliku_mb' => 0.0001");
  const nBefore = (await readRows()).rows.length;
  const capR = await go('/bilety?utm_source=limit_pliku');
  check('Limit wielkości pliku: wejście nie zapisane, przekierowanie działa', (await readRows()).rows.length === nBefore && capR.headers.get('location') === `${T}&utm_source=limit_pliku${F}`);
  check('Zalew: powyżej limitu na minutę tylko znacznik, bez parametrów (przekierowanie działa)', fl.some((x) => x.flood === 1 && !('us' in x)) && (await go('/bilety?utm_source=zalew2')).headers.get('location') === `${T}&utm_source=zalew2${F}`, JSON.stringify(fl) + ' ' + await readFile(path.join(DANE, 'minuta.json'), 'utf8').catch(() => 'brak minuta.json'));
} finally {
  php.kill(); ga.close();
  await rm(dir, { recursive: true, force: true });
}
console.log(`\nWynik: ${total - failed}/${total} testów zaliczonych.`);
process.exit(failed ? 1 : 0);
