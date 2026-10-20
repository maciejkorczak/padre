<?php
/*
 * Panel statystyk krótkiego adresu padreguilherme.pl/bilety. Chroniony hasłem.
 * Dane: _bilety/dane/wejscia-RRRR-MM.ndjson (bez IP i bez ciasteczek odwiedzających).
 */
define('PG_BILETY', 1);
require __DIR__ . '/../_bilety/lib.php';

header('Cache-Control: no-store, private');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'none'; img-src 'self' data:; font-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
if (PHP_VERSION_ID >= 70300) {
  session_set_cookie_params(['lifetime' => 0, 'path' => '/statystyki/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
} else {
  session_set_cookie_params(0, '/statystyki/; samesite=Strict', '', $https, true);
}
session_name('pg_panel');
session_start();

function h($s) { return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function nf($n) { return number_format((float) $n, 0, ',', "\u{00A0}"); }
function pct($a, $b) { return $b > 0 ? number_format(100 * $a / $b, 1, ',', '') . '%' : '0%'; }
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
function csrf_ok() { return isset($_POST['csrf']) && is_string($_POST['csrf']) && hash_equals($_SESSION['csrf'], $_POST['csrf']); }
function csrf_field() { return '<input type="hidden" name="csrf" value="' . h($_SESSION['csrf']) . '">'; }
function back($msg = '', $err = '') { $_SESSION['flash'] = [$msg, $err]; header('Location: ./' . (isset($_POST['q']) && is_string($_POST['q']) && preg_match('/^\?[A-Za-z0-9_=&%.+\-]*$/', $_POST['q']) ? $_POST['q'] : ''), true, 303); exit; }

$c = pg_config();
$logged = !empty($_SESSION['ok']) && time() - (int) $_SESSION['ok'] < 8 * 3600;
$post = $_SERVER['REQUEST_METHOD'] === 'POST';
$act = $post && isset($_POST['a']) && is_string($_POST['a']) ? $_POST['a'] : '';

/* ---------- Logowanie (5 nieudanych prób = 15 minut przerwy) ---------- */
function pg_fails() {
  $d = pg_read_json(PG_DANE . '/logowania.json');
  return array_values(array_filter(is_array($d) ? $d : [], function ($t) { return (int) $t > time() - 900; }));
}
$err = '';
if (!$logged && $act === 'login') {
  $fails = pg_fails();
  if (count($fails) >= 5) $err = 'Za dużo nieudanych prób. Spróbuj ponownie za 15 minut.';
  elseif (!csrf_ok()) $err = 'Sesja wygasła. Spróbuj ponownie.';
  elseif ($c['panel_hash'] !== '' && isset($_POST['haslo']) && is_string($_POST['haslo']) && password_verify($_POST['haslo'], $c['panel_hash'])) {
    session_regenerate_id(true);
    $_SESSION['ok'] = time();
    pg_write_json(PG_DANE . '/logowania.json', []);
    header('Location: ./', true, 303); exit;
  } else {
    $fails[] = time();
    pg_write_json(PG_DANE . '/logowania.json', $fails);
    usleep(400000);
    $err = 'Nieprawidłowe hasło.';
  }
}

function page_head($title) {
  return '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>' . h($title) . '</title><style>' . PG_CSS . '</style></head><body>';
}
const PG_CSS = <<<'CSS'
@font-face { font-family: 'Manrope'; font-weight: 400 800; font-display: swap; src: url(/assets/fonts/manrope-pl.woff2) format('woff2'); unicode-range: U+0104-0107, U+0118-0119, U+0141-0144, U+015A-015B, U+0179-017C; }
@font-face { font-family: 'Manrope'; font-weight: 400 800; font-display: swap; src: url(/assets/fonts/manrope-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212; }
:root { color-scheme: dark; --bg: #0D1513; --surface: #16211F; --surface-2: #1C2927; --line: rgba(236,232,226,.14); --line-2: rgba(236,232,226,.3); --fg: #ECE8E2; --fg-2: #CDD3D0; --fg-3: #A5AEAA; --accent: #E8834E; --ink: #150D08; --ok: #9FE3B4; --bad: #FFB4A9; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; }
.wrap { max-width: 1240px; margin: 0 auto; padding-inline: 16px; padding-block: 24px 64px; }
h1 { margin: 0; font-size: 1.5rem; font-weight: 800; }
h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 800; }
p { margin: 0; }
a { color: var(--fg); text-underline-offset: .2em; }
.muted { color: var(--fg-3); font-size: .875rem; }
.top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; padding-bottom: 20px; border-bottom: 1px solid var(--line); }
.top form { margin: 0; }
.range { display: flex; flex-wrap: wrap; align-items: end; gap: 8px 12px; margin-top: 20px; }
.range label { display: grid; gap: 4px; font-size: .8125rem; color: var(--fg-3); }
.presets { display: flex; flex-wrap: wrap; gap: 6px; }
.presets a, .chip { display: inline-flex; align-items: center; min-height: 36px; padding: 0 12px; border: 1px solid var(--line-2); border-radius: 999px; text-decoration: none; font-size: .8125rem; color: var(--fg-2); }
.presets a[aria-current] { border-color: var(--accent); color: var(--fg); }
input, select { min-height: 40px; padding: 0 12px; border: 1px solid var(--line-2); border-radius: 4px; background: var(--bg); color: var(--fg); font: inherit; }
input[type=password], input[type=text] { width: 100%; max-width: 360px; }
button, .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 16px; border: 1px solid transparent; border-radius: 4px; background: var(--accent); color: var(--ink); font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
button.ghost, .btn.ghost { background: transparent; border-color: var(--line-2); color: var(--fg); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.flash { margin-top: 16px; padding: 12px 16px; border-radius: 4px; border: 1px solid var(--line-2); background: var(--surface); }
.flash.ok { border-color: rgba(159,227,180,.5); } .flash.err { border-color: rgba(255,180,169,.6); }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 24px; }
.tile { padding: 16px 18px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); }
.tile .k { font-size: .8125rem; color: var(--fg-3); }
.tile .v { margin-top: 4px; font-size: 1.75rem; font-weight: 700; line-height: 1.1; }
.tile .s { margin-top: 4px; font-size: .8125rem; color: var(--fg-2); }
.tile.hero .v { font-size: 3rem; }
.card { margin-top: 24px; padding: 18px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); min-width: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 0 24px; }
.chart { width: 100%; height: auto; display: block; }
.chart .grid-line { stroke: rgba(236,232,226,.12); stroke-width: 1; }
.chart .tick { fill: var(--fg-3); font-size: 11px; font-variant-numeric: tabular-nums; }
.chart .bar { fill: var(--accent); }
.chart .hit { fill: transparent; }
.chart .hit:hover + .bar, .chart .bar:hover { fill: #F2A077; }
.tbl-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .875rem; }
th, td { padding: 7px 8px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--fg-3); font-weight: 600; font-size: .75rem; letter-spacing: .04em; text-transform: uppercase; }
td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
td.name { overflow-wrap: anywhere; min-width: 120px; }
.meter { position: relative; height: 6px; margin-top: 5px; border-radius: 3px; background: rgba(236,232,226,.08); }
.meter i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: var(--accent); }
.empty { color: var(--fg-3); font-size: .875rem; padding: 8px 0; }
details summary { cursor: pointer; color: var(--fg-2); font-size: .875rem; margin-top: 12px; }
.row { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: end; }
.row label { display: grid; gap: 4px; font-size: .8125rem; color: var(--fg-3); }
code { font-size: .8125rem; background: var(--bg); padding: 2px 6px; border-radius: 3px; overflow-wrap: anywhere; }
.status-ok { color: var(--ok); } .status-bad { color: var(--bad); }
.login { max-width: 420px; margin: 12vh auto 0; padding: 28px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); }
.login form { display: grid; gap: 12px; margin-top: 18px; }
@media (max-width: 600px) { .tile.hero .v { font-size: 2.25rem; } .grid { grid-template-columns: minmax(0, 1fr); } }
CSS;

if (!$logged) {
  echo page_head('Statystyki /bilety');
  echo '<main class="login"><h1>Statystyki /bilety</h1><p class="muted">padreguilherme.pl</p>';
  if ($c['panel_hash'] === '') echo '<p class="flash err">Panel nie ma ustawionego hasła (brak pliku _bilety/config.php).</p>';
  if ($err) echo '<p class="flash err" role="alert">' . h($err) . '</p>';
  echo '<form method="post">' . csrf_field() . '<input type="hidden" name="a" value="login"><label for="haslo">Hasło</label><input id="haslo" name="haslo" type="password" autocomplete="current-password" required autofocus><button type="submit">Zaloguj</button></form></main></body></html>';
  exit;
}

/* ---------- Akcje (POST) ---------- */
if ($post) {
  if (!csrf_ok()) back('', 'Sesja wygasła. Spróbuj ponownie.');
  if ($act === 'wyloguj') { $_SESSION = []; session_destroy(); header('Location: ./', true, 303); exit; }
  $u = pg_read_json(PG_DANE . '/ustawienia.json');
  if (!is_array($u)) $u = [];
  if ($act === 'ga4_zapisz') {
    $s = isset($_POST['secret']) && is_string($_POST['secret']) ? trim($_POST['secret']) : '';
    if ($s !== '' && !preg_match('/^[A-Za-z0-9_\-]{8,100}$/', $s)) back('', 'Klucz API ma nieprawidłowy format (litery, cyfry, „-” i „_”).');
    $u['ga4_secret'] = $s;
    if (!pg_write_json(PG_DANE . '/ustawienia.json', $u)) back('', 'Nie udało się zapisać ustawień (katalog _bilety/dane niezapisywalny).');
    back($s === '' ? 'Wysyłka do GA4 wyłączona.' : 'Klucz zapisany. Wejścia będą wysyłane do GA4.');
  }
  if ($act === 'ga4_test') {
    if ($c['ga4_secret'] === '') back('', 'Najpierw zapisz klucz API.');
    $r = ['t' => time(), 'us' => 'test', 'um' => 'panel', 'uc' => 'test_polaczenia', 'ux' => '', 'ut' => '', 'ref' => '', 'dev' => 'komputer', 'os' => 'inne', 'app' => '', 'bot' => 0, 'pre' => 0, 'head' => 0];
    list($code, $resp) = pg_http_post(pg_ga4_url(true), json_encode(pg_ga4_payload($r, true)));
    $val = json_decode(is_string($resp) ? $resp : '', true);
    $msgs = is_array($val) && isset($val['validationMessages']) ? $val['validationMessages'] : null;
    if ($code !== 200 || $msgs === null) back('', 'Brak połączenia z GA4 (HTTP ' . $code . ').');
    if ($msgs) back('', 'GA4 zgłasza błąd zdarzenia: ' . pg_clean(json_encode($msgs, JSON_UNESCAPED_UNICODE), 300));
    list($code2) = pg_http_post(pg_ga4_url(false), json_encode(pg_ga4_payload($r, true)));
    back($code2 >= 200 && $code2 < 300 ? 'Test wysłany. W GA4: Administracja → DebugView powinno w ciągu minuty pojawić się zdarzenie „przekierowanie_bilety_test”. Jeśli go nie ma, klucz API jest błędny.' : '', $code2 >= 200 && $code2 < 300 ? '' : 'GA4 odrzuciło zdarzenie (HTTP ' . $code2 . ').');
  }
  if ($act === 'ga4_wyslij') { $n = pg_ga4_flush(200); back('Wysłano do GA4: ' . $n . '.'); }
  if ($act === 'haslo') {
    $old = isset($_POST['stare']) && is_string($_POST['stare']) ? $_POST['stare'] : '';
    $new = isset($_POST['nowe']) && is_string($_POST['nowe']) ? $_POST['nowe'] : '';
    $rep = isset($_POST['nowe2']) && is_string($_POST['nowe2']) ? $_POST['nowe2'] : '';
    if (!password_verify($old, $c['panel_hash'])) back('', 'Obecne hasło jest nieprawidłowe.');
    if (strlen($new) < 12) back('', 'Nowe hasło musi mieć co najmniej 12 znaków.');
    if ($new !== $rep) back('', 'Nowe hasła się różnią.');
    $u['panel_hash'] = password_hash($new, PASSWORD_DEFAULT);
    if (!pg_write_json(PG_DANE . '/ustawienia.json', $u)) back('', 'Nie udało się zapisać hasła.');
    session_regenerate_id(true);
    back('Hasło zmienione.');
  }
  back();
}

/* ---------- Zakres dat i filtry ---------- */
$today = date('Y-m-d');
function pg_date($v, $def) { return is_string($v) && preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]) ? $v : $def; }
$preset = isset($_GET['p']) && is_string($_GET['p']) ? $_GET['p'] : '';
$presets = ['dzis' => ['Dziś', $today, $today], '7' => ['7 dni', date('Y-m-d', strtotime('-6 days')), $today], '30' => ['30 dni', date('Y-m-d', strtotime('-29 days')), $today],
  'mies' => ['Ten miesiąc', date('Y-m-01'), $today], 'all' => ['Wszystko', date('Y-m-01', strtotime('-' . (int) $c['retencja_mies'] . ' months')), $today]];
if (isset($presets[$preset])) { $od = $presets[$preset][1]; $do = $presets[$preset][2]; }
else { $od = pg_date(isset($_GET['od']) ? $_GET['od'] : '', $presets['30'][1]); $do = pg_date(isset($_GET['do']) ? $_GET['do'] : '', $today); if (!isset($_GET['od'])) $preset = '30'; }
if ($od > $do) { $t = $od; $od = $do; $do = $t; }
$tOd = strtotime($od . ' 00:00:00'); $tDo = strtotime($do . ' 23:59:59');
$filters = [];
foreach (['us' => 'utm_source', 'um' => 'utm_medium', 'uc' => 'utm_campaign', 'ux' => 'utm_content'] as $k => $label) {
  if (isset($_GET['f_' . $k]) && is_string($_GET['f_' . $k])) $filters[$k] = pg_clean($_GET['f_' . $k], 200);
}
function qs($extra = [], $drop = []) {
  global $od, $do, $preset, $filters;
  $q = $preset !== '' && isset($GLOBALS['presets'][$preset]) ? ['p' => $preset] : ['od' => $od, 'do' => $do];
  foreach ($filters as $k => $v) $q['f_' . $k] = $v;
  foreach ($drop as $k) unset($q[$k]);
  $q = array_merge($q, $extra);
  return $q ? '?' . http_build_query($q) : '';
}
function eff_source($r) { return $r['us'] !== '' ? $r['us'] : 'direct (brak utm_source)'; }
function match_filters($r, $filters) {
  foreach ($filters as $k => $v) {
    $have = $k === 'us' ? eff_source($r) : (isset($r[$k]) ? $r[$k] : '');
    if ($have === '' ) $have = '(brak)';
    if ($have !== $v) return false;
  }
  return true;
}

// Czyta zapisy z zakresu dat strumieniowo (bez trzymania wszystkich w pamięci).
function each_record($tOd, $tDo, $fn) {
  for ($m = strtotime(date('Y-m-01', $tOd)); $m <= $tDo; $m = strtotime('+1 month', $m)) {
    $f = pg_log_file($m);
    if (!is_file($f) || !($fh = @fopen($f, 'r'))) continue;
    while (($line = fgets($fh)) !== false) {
      $r = json_decode($line, true);
      if (!is_array($r) || !isset($r['t'])) continue;
      $r['t'] = (int) $r['t'];
      if ($r['t'] < $tOd || $r['t'] > $tDo) continue;
      foreach (['us', 'um', 'uc', 'ux', 'ut', 'ref', 'dev', 'os', 'app'] as $k) $r[$k] = isset($r[$k]) ? (string) $r[$k] : '';
      $fn($r);
    }
    fclose($fh);
  }
}

/* ---------- Eksport CSV ---------- */
if (isset($_GET['eksport']) && $_GET['eksport'] === 'csv') {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="bilety-wejscia-' . $od . '_' . $do . '.csv"');
  $out = fopen('php://output', 'w');
  fwrite($out, "\xEF\xBB\xBF");
  $safe = function ($v) { $v = (string) $v; return preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v; };
  fputcsv($out, ['data', 'godzina', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'strona_odsylajaca', 'aplikacja', 'urzadzenie', 'system', 'reklama_meta_fbclid', 'reklama_google_gclid', 'robot_lub_podglad'], ';', '"', '\\');
  each_record($tOd, $tDo, function ($r) use ($out, $safe, $filters) {
    if (!match_filters($r, $filters)) return;
    fputcsv($out, array_map($safe, [date('Y-m-d', $r['t']), date('H:i:s', $r['t']), $r['us'], $r['um'], $r['uc'], $r['ux'], $r['ut'], $r['ref'], $r['app'], $r['dev'], $r['os'],
      empty($r['fbclid']) ? 0 : 1, (empty($r['gclid']) && empty($r['gbraid']) && empty($r['wbraid'])) ? 0 : 1, pg_is_human($r) ? 0 : 1]), ';', '"', '\\');
  });
  fclose($out);
  exit;
}

/* ---------- Zestawienia ---------- */
$days = [];
for ($d = $tOd; $d <= $tDo; $d = strtotime('+1 day', $d)) $days[date('Y-m-d', $d)] = 0;
$tot = 0; $bots = 0; $pre = 0; $ads = ['meta' => 0, 'google' => 0, 'tiktok' => 0];
$dims = ['us' => [], 'um' => [], 'uc' => [], 'ux' => [], 'combo' => [], 'ref' => [], 'app' => [], 'dev' => [], 'os' => [], 'ad' => []];
$recent = [];
each_record($tOd, $tDo, function ($r) use (&$days, &$tot, &$bots, &$pre, &$ads, &$dims, &$recent, $filters) {
  if (!match_filters($r, $filters)) return;
  if (!pg_is_human($r)) { if (!empty($r['bot'])) $bots++; else $pre++; return; }
  $tot++;
  $day = date('Y-m-d', $r['t']);
  if (isset($days[$day])) $days[$day]++;
  $ad = !empty($r['fbclid']) ? 'meta' : ((!empty($r['gclid']) || !empty($r['gbraid']) || !empty($r['wbraid'])) ? 'google' : (!empty($r['ttclid']) ? 'tiktok' : ''));
  if ($ad) $ads[$ad]++;
  $vals = ['us' => eff_source($r), 'um' => $r['um'], 'uc' => $r['uc'], 'ux' => $r['ux'],
    'combo' => eff_source($r) . ' / ' . ($r['um'] !== '' ? $r['um'] : '(brak)') . ' / ' . ($r['uc'] !== '' ? $r['uc'] : '(brak)'),
    'ref' => $r['ref'] !== '' ? $r['ref'] : '(brak - aplikacja lub wpisany adres)', 'app' => $r['app'] !== '' ? $r['app'] : 'przeglądarka',
    'dev' => $r['dev'], 'os' => $r['os'], 'ad' => $ad !== '' ? ['meta' => 'reklama Meta (fbclid)', 'google' => 'reklama Google (gclid)', 'tiktok' => 'reklama TikTok (ttclid)'][$ad] : 'bez identyfikatora reklamy'];
  foreach ($vals as $k => $v) { if ($v === '') $v = '(brak)'; $dims[$k][$v] = (isset($dims[$k][$v]) ? $dims[$k][$v] : 0) + 1; }
  $recent[] = $r;
  if (count($recent) > 50) array_shift($recent);
});
foreach ($dims as &$d) arsort($d); unset($d);
$recent = array_reverse($recent);
$nDays = count($days);
$todayCount = isset($days[$today]) ? $days[$today] : 0;
$adTotal = array_sum($ads);

/* ---------- Wykres: wejścia dziennie (jedna seria, skala od zera) ---------- */
function nice_max($v) {
  if ($v <= 4) return 4;
  $p = pow(10, floor(log10($v))); $f = $v / $p;
  $n = $f <= 1 ? 1 : ($f <= 2 ? 2 : ($f <= 2.5 ? 2.5 : ($f <= 5 ? 5 : 10)));
  return $n * $p;
}
function chart_days($days) {
  $W = 960; $H = 240; $L = 44; $R = 8; $T = 12; $B = 30;
  $pw = $W - $L - $R; $ph = $H - $T - $B;
  $n = max(1, count($days)); $max = nice_max(max(1, max($days)));
  $slot = $pw / $n; $bw = min(24, max(2, $slot - 2));
  $s = '<svg class="chart" viewBox="0 0 ' . $W . ' ' . $H . '" role="img" aria-label="Wejścia dziennie, wykres słupkowy">';
  for ($i = 0; $i <= 4; $i++) {
    $v = $max * $i / 4; $y = $T + $ph - $ph * $i / 4;
    $s .= '<line class="grid-line" x1="' . $L . '" x2="' . ($W - $R) . '" y1="' . round($y, 1) . '" y2="' . round($y, 1) . '"/>';
    $s .= '<text class="tick" x="' . ($L - 8) . '" y="' . round($y + 4, 1) . '" text-anchor="end">' . h(nf($v)) . '</text>';
  }
  $every = max(1, (int) ceil($n / 10)); $i = 0;
  $dn = ['nd.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
  foreach ($days as $day => $v) {
    $x = $L + $i * $slot + ($slot - $bw) / 2; $hgt = $ph * $v / $max; $y0 = $T + $ph;
    $t = strtotime($day); $label = $dn[(int) date('w', $t)] . ' ' . date('d.m', $t) . ': ' . nf($v) . ' ' . ($v === 1 ? 'wejście' : (($v % 10 >= 2 && $v % 10 <= 4 && ($v % 100 < 10 || $v % 100 >= 20)) ? 'wejścia' : 'wejść'));
    $s .= '<g><title>' . h($label) . '</title><rect class="hit" x="' . round($L + $i * $slot, 1) . '" y="' . $T . '" width="' . round($slot, 1) . '" height="' . $ph . '"/>';
    if ($v > 0) {
      $hh = max(2, $hgt); $rad = min(4, $hh, $bw / 2); $yt = $y0 - $hh;
      $s .= '<path class="bar" d="M' . round($x, 1) . ',' . $y0 . 'V' . round($yt + $rad, 1) . 'Q' . round($x, 1) . ',' . round($yt, 1) . ' ' . round($x + $rad, 1) . ',' . round($yt, 1) . 'H' . round($x + $bw - $rad, 1) . 'Q' . round($x + $bw, 1) . ',' . round($yt, 1) . ' ' . round($x + $bw, 1) . ',' . round($yt + $rad, 1) . 'V' . $y0 . 'Z"/>';
    }
    $s .= '</g>';
    if ($i % $every === 0) $s .= '<text class="tick" x="' . round($L + $i * $slot + $slot / 2, 1) . '" y="' . ($H - 10) . '" text-anchor="middle">' . h(date('d.m', $t)) . '</text>';
    $i++;
  }
  $s .= '<line class="grid-line" x1="' . $L . '" x2="' . ($W - $R) . '" y1="' . ($T + $ph) . '" y2="' . ($T + $ph) . '" style="stroke:rgba(236,232,226,.3)"/></svg>';
  return $s;
}

function dim_table($title, $data, $total, $filterKey = '', $limit = 12) {
  $s = '<section><h2>' . h($title) . '</h2>';
  if (!$data) return $s . '<p class="empty">Brak danych w tym zakresie.</p></section>';
  $s .= '<div class="tbl-wrap"><table><thead><tr><th>Wartość</th><th class="n">Wejścia</th><th class="n">Udział</th></tr></thead><tbody>';
  $i = 0; $other = 0;
  foreach ($data as $k => $v) {
    if ($i++ >= $limit) { $other += $v; continue; }
    $name = h($k);
    if ($filterKey !== '') $name = '<a href="' . h(qs(['f_' . $filterKey => (string) $k])) . '">' . $name . '</a>';
    $s .= '<tr><td class="name">' . $name . '<div class="meter" aria-hidden="true"><i style="width:' . round(100 * $v / max(1, $total), 1) . '%"></i></div></td><td class="n">' . nf($v) . '</td><td class="n">' . pct($v, $total) . '</td></tr>';
  }
  if ($other) $s .= '<tr><td class="name">Pozostałe (' . nf(count($data) - $limit) . ')</td><td class="n">' . nf($other) . '</td><td class="n">' . pct($other, $total) . '</td></tr>';
  return $s . '</tbody></table></div></section>';
}

/* ---------- Strona ---------- */
$flash = isset($_SESSION['flash']) ? $_SESSION['flash'] : null; unset($_SESSION['flash']);
$ga = pg_read_json(PG_DANE . '/ga4-stan.json'); if (!is_array($ga)) $ga = [];
echo page_head('Statystyki /bilety');
echo '<div class="wrap">';
echo '<header class="top"><div><h1>Statystyki /bilety</h1><p class="muted">Wejścia na <code>padreguilherme.pl/bilety</code> przed przekierowaniem do sprzedaży biletów. Bez robotów i podglądów linków.</p></div>';
echo '<form method="post">' . csrf_field() . '<input type="hidden" name="a" value="wyloguj"><button class="ghost" type="submit">Wyloguj</button></form></header>';
if ($flash && ($flash[0] || $flash[1])) echo '<p class="flash ' . ($flash[1] ? 'err' : 'ok') . '" role="status">' . h($flash[1] ?: $flash[0]) . '</p>';

echo '<form class="range" method="get"><div class="presets" aria-label="Szybki zakres">';
foreach ($presets as $k => $p) echo '<a href="' . h('?p=' . $k) . '"' . ($preset === $k ? ' aria-current="true"' : '') . '>' . h($p[0]) . '</a>';
echo '</div><label>Od<input type="date" name="od" value="' . h($od) . '"></label><label>Do<input type="date" name="do" value="' . h($do) . '"></label>';
foreach ($filters as $k => $v) echo '<input type="hidden" name="f_' . h($k) . '" value="' . h($v) . '">';
echo '<button class="ghost" type="submit">Pokaż</button><a class="btn ghost" href="' . h(qs(['eksport' => 'csv'])) . '">Pobierz CSV</a></form>';
if ($filters) {
  echo '<p class="muted" style="margin-top:12px">Filtr: ';
  $names = ['us' => 'źródło', 'um' => 'medium', 'uc' => 'kampania', 'ux' => 'treść'];
  foreach ($filters as $k => $v) echo '<a class="chip" href="' . h(qs([], ['f_' . $k])) . '">' . h($names[$k] . ': ' . $v) . ' ✕</a> ';
  echo '</p>';
}

echo '<div class="tiles">';
echo '<div class="tile hero"><p class="k">Wejścia ' . h(date('d.m.Y', $tOd)) . ' - ' . h(date('d.m.Y', $tDo)) . '</p><p class="v">' . nf($tot) . '</p><p class="s">średnio ' . number_format($nDays ? $tot / $nDays : 0, 1, ',', '') . ' dziennie</p></div>';
echo '<div class="tile"><p class="k">Dziś</p><p class="v">' . nf($todayCount) . '</p></div>';
echo '<div class="tile"><p class="k">Z kliknięcia reklamy</p><p class="v">' . nf($adTotal) . '</p><p class="s">' . pct($adTotal, $tot) . ' wejść (Meta ' . nf($ads['meta']) . ', Google ' . nf($ads['google']) . ', TikTok ' . nf($ads['tiktok']) . ')</p></div>';
echo '<div class="tile"><p class="k">Pominięte</p><p class="v">' . nf($bots + $pre) . '</p><p class="s">roboty ' . nf($bots) . ', podglądy i HEAD ' . nf($pre) . '</p></div>';
echo '</div>';

echo '<section class="card"><h2>Wejścia dziennie</h2>' . chart_days($days);
echo '<details><summary>Tabela dzienna</summary><div class="tbl-wrap"><table><thead><tr><th>Dzień</th><th class="n">Wejścia</th></tr></thead><tbody>';
foreach (array_reverse($days, true) as $day => $v) echo '<tr><td>' . h(date('d.m.Y', strtotime($day))) . '</td><td class="n">' . nf($v) . '</td></tr>';
echo '</tbody></table></div></details></section>';

echo '<div class="card"><div class="grid">';
echo dim_table('Źródło (utm_source)', $dims['us'], $tot, 'us');
echo dim_table('Medium (utm_medium)', $dims['um'], $tot, 'um');
echo dim_table('Kampania (utm_campaign)', $dims['uc'], $tot, 'uc');
echo dim_table('Treść / kreacja (utm_content)', $dims['ux'], $tot, 'ux');
echo '</div></div>';
echo '<div class="card">' . dim_table('Źródło / medium / kampania', $dims['combo'], $tot, '', 20) . '</div>';
echo '<div class="card"><div class="grid">';
echo dim_table('Strona odsyłająca', $dims['ref'], $tot);
echo dim_table('Aplikacja', $dims['app'], $tot);
echo dim_table('Urządzenie', $dims['dev'], $tot);
echo dim_table('System', $dims['os'], $tot);
echo dim_table('Kliknięcie reklamy', $dims['ad'], $tot);
echo '</div></div>';

echo '<section class="card"><h2>Ostatnie wejścia</h2>';
if (!$recent) echo '<p class="empty">Brak wejść w tym zakresie.</p>';
else {
  echo '<div class="tbl-wrap"><table><thead><tr><th>Czas</th><th>Źródło</th><th>Medium</th><th>Kampania</th><th>Treść</th><th>Strona odsyłająca</th><th>Aplikacja / urządzenie</th><th>Reklama</th></tr></thead><tbody>';
  foreach ($recent as $r) {
    $ad = !empty($r['fbclid']) ? 'Meta' : ((!empty($r['gclid']) || !empty($r['gbraid']) || !empty($r['wbraid'])) ? 'Google' : (!empty($r['ttclid']) ? 'TikTok' : '-'));
    echo '<tr><td class="n">' . h(date('d.m H:i', $r['t'])) . '</td><td class="name">' . h(eff_source($r)) . '</td><td class="name">' . h($r['um'] ?: '-') . '</td><td class="name">' . h($r['uc'] ?: '-') . '</td><td class="name">' . h($r['ux'] ?: '-') . '</td><td class="name">' . h($r['ref'] ?: '-') . '</td><td>' . h(($r['app'] ?: 'przeglądarka') . ', ' . $r['dev'] . ', ' . $r['os']) . '</td><td>' . h($ad) . '</td></tr>';
  }
  echo '</tbody></table></div>';
}
echo '</section>';

/* Generator linków (jedno nazewnictwo kampanii) */
$b = [];
foreach (['us', 'um', 'uc', 'ux'] as $k) $b[$k] = isset($_GET['b_' . $k]) && is_string($_GET['b_' . $k]) ? pg_clean($_GET['b_' . $k], 100) : '';
echo '<section class="card"><h2>Link do kampanii</h2><p class="muted">Zalecane nazewnictwo: małe litery, bez spacji i polskich znaków, np. <code>instagram</code> / <code>paid_social</code> / <code>padre_lodz_2027</code> / <code>reel_skytech_01</code>.</p>';
echo '<form class="row" method="get" style="margin-top:12px">';
foreach (['us' => 'utm_source', 'um' => 'utm_medium', 'uc' => 'utm_campaign', 'ux' => 'utm_content'] as $k => $l) echo '<label>' . h($l) . '<input type="text" name="b_' . h($k) . '" value="' . h($b[$k]) . '" style="max-width:200px"></label>';
echo '<input type="hidden" name="od" value="' . h($od) . '"><input type="hidden" name="do" value="' . h($do) . '"><button class="ghost" type="submit">Utwórz link</button></form>';
if (array_filter($b)) {
  $q = [];
  foreach (['us' => 'utm_source', 'um' => 'utm_medium', 'uc' => 'utm_campaign', 'ux' => 'utm_content'] as $k => $l) if ($b[$k] !== '') $q[$l] = $b[$k];
  echo '<p style="margin-top:12px">Link: <code>' . h('https://padreguilherme.pl/bilety?' . http_build_query($q, '', '&', PHP_QUERY_RFC3986)) . '</code></p>';
  echo '<p class="muted" style="margin-top:6px">Prowadzi do: <code>' . h(pg_target(pg_params($q)[0], [])) . '</code></p>';
}
echo '</section>';

/* GA4 */
$pending = $c['ga4_secret'] !== '' ? pg_ga4_pending() : 0;
echo '<section class="card"><h2>Google Analytics 4</h2>';
echo '<p class="muted">Każde wejście (bez robotów) może trafiać do GA4 ' . h($c['ga4_id']) . ' jako zdarzenie <code>przekierowanie_bilety</code> z parametrami <code>redirect_source</code>, <code>redirect_medium</code>, <code>redirect_campaign</code>, <code>redirect_content</code>, <code>redirect_referrer</code>, <code>redirect_app</code>, <code>redirect_device</code>, <code>redirect_ad_click</code>. Wysyła serwer: bez ciasteczek, bez adresu IP i przeglądarki odwiedzającego, z losowym identyfikatorem dla każdego wejścia i zgodami reklamowymi ustawionymi na „odmowa”.</p>';
if ($c['ga4_secret'] === '') echo '<p style="margin-top:10px">Stan: <span class="status-bad">wyłączone</span> (brak klucza API).</p>';
else {
  echo '<p style="margin-top:10px">Stan: <span class="status-ok">włączone</span>. Wysłano: ' . nf(isset($ga['wyslane']) ? $ga['wyslane'] : 0) . (isset($ga['ok_t']) ? ', ostatnio ' . h(date('d.m.Y H:i', (int) $ga['ok_t'])) : '') . '. Czeka na wysyłkę: ' . nf($pending) . '.</p>';
  if (!empty($ga['blad'])) echo '<p class="status-bad" style="margin-top:6px">Ostatni błąd (' . h(date('d.m H:i', (int) $ga['blad_t'])) . '): ' . h($ga['blad']) . '</p>';
  if (!function_exists('fastcgi_finish_request')) echo '<p class="muted" style="margin-top:6px">Serwer nie wysyła do GA4 przy każdym wejściu (brak PHP-FPM): użyj przycisku „Wyślij zaległe” co najmniej raz na 3 dni.</p>';
}
echo '<form class="row" method="post" style="margin-top:12px">' . csrf_field() . '<input type="hidden" name="q" value="' . h(qs()) . '"><input type="hidden" name="a" value="ga4_zapisz"><label>Klucz API Measurement Protocol<input type="password" name="secret" autocomplete="off" placeholder="' . ($c['ga4_secret'] !== '' ? 'zapisany - wpisz nowy albo zostaw puste, aby wyłączyć' : 'wklej klucz z GA4') . '"></label><button type="submit">Zapisz</button></form>';
if ($c['ga4_secret'] !== '') {
  echo '<div class="row" style="margin-top:12px"><form method="post">' . csrf_field() . '<input type="hidden" name="q" value="' . h(qs()) . '"><input type="hidden" name="a" value="ga4_test"><button class="ghost" type="submit">Wyślij test</button></form>';
  echo '<form method="post">' . csrf_field() . '<input type="hidden" name="q" value="' . h(qs()) . '"><input type="hidden" name="a" value="ga4_wyslij"><button class="ghost" type="submit">Wyślij zaległe</button></form></div>';
}
echo '<details><summary>Jak uzyskać klucz i zobaczyć dane w GA4</summary><ol class="muted" style="margin:8px 0 0;padding-left:20px">';
echo '<li>GA4 → Administracja → Strumienie danych → strumień padreguilherme.pl → Klucze API Measurement Protocol → Utwórz. Skopiuj „Wartość klucza” i wklej powyżej.</li>';
echo '<li>Kliknij „Wyślij test” i sprawdź GA4 → Administracja → DebugView.</li>';
echo '<li>GA4 → Administracja → Definicje niestandardowe → Utwórz wymiary (zakres: zdarzenie) dla parametrów redirect_source, redirect_medium, redirect_campaign, redirect_content, redirect_referrer, redirect_app. Raporty: Zaangażowanie → Zdarzenia → przekierowanie_bilety albo Eksploracje.</li>';
echo '<li>Lokalizacja (kraj, miasto) tych zdarzeń w GA4 dotyczy serwera, nie odwiedzającego. Pełne dane są w tym panelu.</li></ol></details></section>';

/* Hasło i diagnostyka */
echo '<section class="card"><h2>Hasło do panelu</h2><form class="row" method="post">' . csrf_field() . '<input type="hidden" name="q" value="' . h(qs()) . '"><input type="hidden" name="a" value="haslo">';
echo '<label>Obecne<input type="password" name="stare" autocomplete="current-password" required style="max-width:220px"></label><label>Nowe (min. 12 znaków)<input type="password" name="nowe" autocomplete="new-password" minlength="12" required style="max-width:220px"></label><label>Powtórz nowe<input type="password" name="nowe2" autocomplete="new-password" minlength="12" required style="max-width:220px"></label><button class="ghost" type="submit">Zmień hasło</button></form></section>';

$writable = is_dir(PG_DANE) ? is_writable(PG_DANE) : is_writable(PG_DIR);
echo '<section class="card"><h2>Co jest zapisywane</h2><p class="muted">Data i godzina, parametry utm_*, domena strony odsyłającej (bez pełnego adresu), rodzaj urządzenia, system, aplikacja (np. Instagram) i informacja, czy w linku był identyfikator kliknięcia reklamy (bez jego wartości). Bez adresu IP, bez pełnego opisu przeglądarki i bez ciasteczek. Zapisy starsze niż ' . (int) $c['retencja_mies'] . ' miesięcy są usuwane automatycznie. Wejść nie da się powiązać z osobą, dlatego panel liczy wejścia, a nie unikalnych użytkowników.</p>';
echo '<p class="muted" style="margin-top:10px">Diagnostyka: PHP ' . h(PHP_VERSION) . ' · zapis danych: ' . ($writable ? '<span class="status-ok">tak</span>' : '<span class="status-bad">NIE</span>') . ' · wysyłka po odpowiedzi (PHP-FPM): ' . (function_exists('fastcgi_finish_request') ? 'tak' : 'nie') . ' · cURL: ' . (function_exists('curl_init') ? 'tak' : 'nie') . '</p></section>';
echo '</div></body></html>';
pg_cleanup();
