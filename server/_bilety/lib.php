<?php
/*
 * Krótki adres /bilety: adres docelowy, zapis wejść i wysyłka do GA4. PHP 7.0+.
 *
 * Prywatność: zapisujemy tylko datę, parametry kampanii (utm_*, bez adresów e-mail i numerów telefonów),
 * domenę strony odsyłającej, rodzaj urządzenia i aplikacji oraz to, czy w adresie był identyfikator
 * kliknięcia (fbclid, gclid...). Bez adresu IP, bez pełnego user-agenta, bez wartości identyfikatorów
 * i bez ciasteczek odwiedzającego.
 */
if (!defined('PG_BILETY')) { http_response_code(403); exit; }

define('PG_DIR', __DIR__);
date_default_timezone_set('Europe/Warsaw');

// Parametry przekazywane do eBilet oprócz utm_*: identyfikatory kliknięć (i parametry automatycznego tagowania Google Ads).
const PG_CLICK_IDS = ['fbclid', 'gclid', 'gbraid', 'wbraid', 'gad_source', 'gad_campaignid', 'dclid', 'ttclid', 'msclkid'];
const PG_UTM_ORDER = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
// Pierwsza linia plików danych (wszystkie mają rozszerzenie .php): gdyby serwer zignorował .htaccess,
// plik się wykona i nic nie pokaże.
const PG_GUARD = "<?php exit; ?>\n";

function pg_config() {
  static $c = null;
  if ($c !== null) return $c;
  $c = [
    'target' => 'https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme',
    'partner' => 'l2lsp',
    'fragment' => 'padre-guilherme_155685,1622',
    'default_source' => 'direct',   // gdy link kampanii nie ma utm_source
    'ga4_id' => 'G-MQFK04FB3F',
    'ga4_secret' => '',             // klucz API Measurement Protocol (wpisywany w panelu); pusty = bez GA4
    'ga4_endpoint' => 'https://www.google-analytics.com',
    'panel_hash' => '',             // hash hasła do panelu (config.php albo zmiana w panelu)
    'retencja_mies' => 14,          // tyle pełnych miesięcy (plus bieżący) trzymamy zapisy wejść
    'limit_minuta' => 3000,         // powyżej tylu wejść na minutę zapisujemy tylko czas (ochrona przed zalewem)
    'limit_pliku_mb' => 100,        // powyżej tej wielkości pliku miesiąca nie zapisujemy nic (ochrona dysku)
    'dane_dir' => __DIR__ . '/dane',
  ];
  $f = PG_DIR . '/config.php';
  if (is_file($f)) { $x = include $f; if (is_array($x)) $c = array_merge($c, $x); }
  $u = pg_settings();
  if (is_array($u)) $c = array_merge($c, array_intersect_key($u, ['ga4_secret' => 1, 'panel_hash' => 1]));
  return $c;
}

function pg_dane() { static $d = null; if ($d === null) $d = rtrim(pg_config_raw('dane_dir'), '/'); return $d; }
// Wartość z config.php bez ustawień z panelu (potrzebna, zanim wiadomo, gdzie są dane).
function pg_config_raw($k) {
  static $raw = null;
  if ($raw === null) {
    $raw = ['dane_dir' => __DIR__ . '/dane'];
    $f = PG_DIR . '/config.php';
    if (is_file($f)) { $x = include $f; if (is_array($x)) $raw = array_merge($raw, $x); }
  }
  return isset($raw[$k]) ? $raw[$k] : null;
}

// Ustawienia z panelu (klucz GA4, nowe hasło, klucz do ograniczania logowań). Czytane jako dane (JSON),
// nie przez include, więc pamięć podręczna PHP (opcache) nigdy nie poda starej wersji.
// Zmiany tylko przez pg_update_state('ustawienia.php', ...) (pod blokadą).
function pg_settings() { return pg_read_state('ustawienia.php'); }

// Mały plik stanu (JSON po linii PG_GUARD, nazwa *.php) w katalogu danych.
function pg_read_state($name) {
  $f = pg_dane() . '/' . $name;
  if (!is_file($f)) return [];
  $s = @file_get_contents($f);
  if ($s === false) return [];
  $s = substr($s, 0, strlen(PG_GUARD)) === PG_GUARD ? substr($s, strlen(PG_GUARD)) : $s;
  $d = json_decode($s, true);
  return is_array($d) ? $d : [];
}
function pg_write_state($name, $data) {
  pg_ensure_dir();
  $f = pg_dane() . '/' . $name;
  $tmp = $f . '.' . bin2hex(random_bytes(4)) . '.tmp';
  if (@file_put_contents($tmp, PG_GUARD . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) { @unlink($tmp); return false; }
  @chmod($tmp, 0600);
  if (!@rename($tmp, $f)) { @unlink($tmp); return false; }
  return true;
}
// Odczyt-zmiana-zapis pod blokadą (np. licznik nieudanych logowań).
function pg_update_state($name, $fn) {
  pg_ensure_dir();
  $lock = @fopen(pg_dane() . '/' . $name . '.lock', 'c');
  if ($lock) flock($lock, LOCK_EX);
  $new = $fn(pg_read_state($name));
  $ok = pg_write_state($name, $new);
  if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
  return $ok ? $new : null;
}

// Katalog danych: niedostępny z internetu (deny w .htaccess wyżej i tutaj; pliki zaczynają się od PG_GUARD).
function pg_ensure_dir() {
  $d = pg_dane();
  if (!is_dir($d)) @mkdir($d, 0700, true);
  if (is_dir($d) && !is_file($d . '/.htaccess')) {
    @file_put_contents($d . '/.htaccess', "Require all denied\n");
    @file_put_contents($d . '/index.html', '');
  }
  if (is_dir($d . '/sesje') && !is_file($d . '/sesje/index.html')) @file_put_contents($d . '/sesje/index.html', '');
}

function pg_cut($s, $max) {
  if (function_exists('mb_substr')) return mb_substr($s, 0, $max, 'UTF-8');
  return preg_match('/^.{0,' . (int) $max . '}/us', $s, $m) ? $m[0] : substr($s, 0, $max);
}
function pg_clean($s, $max) {
  $s = (string) $s;
  if (!preg_match('//u', $s)) $s = preg_replace('/[\x80-\xFF]/', '', $s); // niepoprawne UTF-8
  $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s));
  return pg_cut($s, $max);
}

// Z parametrów adresu: utm_* i identyfikatory kliknięć (reszta jest pomijana). Wartości trafiają do eBilet
// bez skracania (do 1000 znaków); do statystyk idą skrócone i oczyszczone (pg_stat_value).
function pg_params($get) {
  $utm = []; $click = [];
  foreach ($get as $k => $v) {
    if (!is_string($v) || !is_string($k)) continue;
    $k = preg_replace('/^(amp;)+/', '', strtolower($k)); // link wklejony z HTML: „&amp;utm_medium=”
    $v = pg_clean($v, 1000);
    if ($v === '') continue;
    if (preg_match('/^utm_[a-z0-9_]{1,30}$/', $k)) { if (count($utm) < 20 || isset($utm[$k])) $utm[$k] = $v; }
    elseif (in_array($k, PG_CLICK_IDS, true)) $click[$k] = $v;
  }
  return [$utm, $click];
}

// Adres eBilet: zawsze partner=l2lsp, parametry kampanii z linku (utm_source=direct, gdy go brak),
// identyfikatory kliknięć i kotwica wydarzenia. Adres bez „/” przed „?” (wersja z ukośnikiem gubi utm_source).
function pg_target($utm, $click) {
  $c = pg_config();
  $build = function ($utm, $click) use ($c) {
    $q = ['partner' => $c['partner']];
    if (!isset($utm['utm_source'])) $utm['utm_source'] = $c['default_source'];
    foreach (PG_UTM_ORDER as $k) if (isset($utm[$k])) { $q[$k] = $utm[$k]; unset($utm[$k]); }
    foreach ($utm as $k => $v) $q[$k] = $v;
    foreach ($click as $k => $v) $q[$k] = $v;
    return $c['target'] . '?' . http_build_query($q, '', '&', PHP_QUERY_RFC3986) . '#' . $c['fragment'];
  };
  $url = $build($utm, $click);
  // Nagłówek Location powyżej ok. 8 KB serwer odrzuca: przy nienaturalnie długich linkach zostają podstawowe parametry.
  if (strlen($url) > 6000) $url = $build(array_intersect_key($utm, array_flip(PG_UTM_ORDER)), $click);
  if (strlen($url) > 6000) $url = $build([], []);
  return $url;
}

function pg_ref_host($ref) {
  $h = parse_url((string) $ref, PHP_URL_HOST);
  if (!is_string($h) || $h === '') return '';
  return pg_clean(preg_replace('/^www\./', '', strtolower($h)), 100);
}

// Wartość parametru kampanii do statystyk: małe litery (jedna nazwa = jeden wiersz), bez adresów e-mail
// i numerów telefonów (gdyby ktoś wpisał je do linku), najwyżej 100 znaków.
function pg_stat_value($v) {
  $v = pg_clean($v, 300);
  $v = function_exists('mb_strtolower') ? mb_strtolower($v, 'UTF-8') : strtolower($v);
  $v = preg_replace('/[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}/u', '(usunięto e-mail)', $v);
  // Numer telefonu: z „+” albo w grupach 3-3-3. Same ciągi cyfr zostają (to zwykle identyfikatory kampanii).
  $v = preg_replace('/\+\d[\d \-]{7,}\d|(?<!\d)\d{3}[ \-]\d{3}[ \-]\d{3}(?!\d)/u', '(usunięto numer)', $v);
  return pg_cut($v, 100);
}

// Rodzaj klienta z user-agenta (sam user-agent nie jest zapisywany).
function pg_client($ua) {
  $ua = (string) $ua;
  $bot = $ua === '' || preg_match('~(?<!cu)bot\b|bot/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-external|whatsapp|discord|skypeuripreview|embedly|iframely|slack-imgproxy|cardyb|preview|google-|googleother|apis-google|mediapartners|curl/|wget/|python|go-http|java/|okhttp|axios|node-fetch|headlesschrome|lighthouse|pingdom|uptime|monitor~i', $ua);
  $app = '';
  if (preg_match('~Instagram~i', $ua)) $app = 'instagram';
  elseif (preg_match('~FBAN/Messenger|MessengerForiOS|Orca-Android~i', $ua)) $app = 'messenger';
  elseif (preg_match('~FBAN|FBAV|FB_IAB|FBIOS|FB4A~', $ua)) $app = 'facebook';
  elseif (preg_match('~musical_ly|TikTok|BytedanceWebview|trill_~i', $ua)) $app = 'tiktok';
  elseif (preg_match('~Snapchat~i', $ua)) $app = 'snapchat';
  elseif (preg_match('~LinkedInApp~i', $ua)) $app = 'linkedin';
  elseif (preg_match('~Pinterest~i', $ua)) $app = 'pinterest';
  elseif (preg_match('~Threads|Barcelona~', $ua)) $app = 'threads';
  $mobi = preg_match('~Mobi|iPhone|iPod|Windows Phone~i', $ua);
  if ($bot) $dev = 'bot';
  elseif (preg_match('~iPad|Tablet~i', $ua) || (preg_match('~Android~i', $ua) && !$mobi)) $dev = 'tablet';
  elseif ($mobi || preg_match('~Android~i', $ua)) $dev = 'telefon';
  else $dev = 'komputer';
  if (preg_match('~iPhone|iPad|iPod|iOS~', $ua)) $os = 'iOS';
  elseif (preg_match('~Android~i', $ua)) $os = 'Android';
  elseif (preg_match('~Windows~i', $ua)) $os = 'Windows';
  elseif (preg_match('~Macintosh|Mac OS X~', $ua)) $os = 'macOS';
  elseif (preg_match('~Linux|CrOS~', $ua)) $os = 'Linux';
  else $os = 'inne';
  return ['dev' => $dev, 'os' => $os, 'app' => $app, 'bot' => $bot ? 1 : 0];
}

function pg_record($utm, $click, $server) {
  $cl = pg_client(isset($server['HTTP_USER_AGENT']) ? $server['HTTP_USER_AGENT'] : '');
  $purpose = '';
  foreach (['HTTP_SEC_PURPOSE', 'HTTP_PURPOSE', 'HTTP_X_PURPOSE', 'HTTP_X_MOZ'] as $h) if (!empty($server[$h])) $purpose .= ' ' . $server[$h];
  $v = function ($k) use ($utm) { return isset($utm[$k]) ? pg_stat_value($utm[$k]) : ''; };
  $r = [
    't' => time(),
    'us' => $v('utm_source'), 'um' => $v('utm_medium'), 'uc' => $v('utm_campaign'), 'ux' => $v('utm_content'), 'ut' => $v('utm_term'),
    'ref' => pg_ref_host(isset($server['HTTP_REFERER']) ? $server['HTTP_REFERER'] : ''),
    'dev' => $cl['dev'], 'os' => $cl['os'], 'app' => $cl['app'], 'bot' => $cl['bot'],
    'pre' => preg_match('~prefetch|prerender|preview~i', $purpose) ? 1 : 0,
    'head' => (isset($server['REQUEST_METHOD']) && $server['REQUEST_METHOD'] !== 'GET') ? 1 : 0, // HEAD, POST, OPTIONS: nie odwiedziny
  ];
  // Sygnał „nie śledź” (Global Privacy Control / Do Not Track): wejście liczymy, ale nie wysyłamy do GA4.
  if ((isset($server['HTTP_SEC_GPC']) && trim($server['HTTP_SEC_GPC']) === '1') || (isset($server['HTTP_DNT']) && trim($server['HTTP_DNT']) === '1')) $r['gpc'] = 1;
  foreach (PG_CLICK_IDS as $k) if (isset($click[$k])) $r[$k] = 1; // tylko informacja „był”, bez wartości
  return $r;
}

function pg_log_file($ts = null) { return pg_dane() . '/wejscia-' . date('Y-m', $ts === null ? time() : $ts) . '.php'; }

// Zapis wejścia. Powyżej limitu wejść na minutę zapisujemy tylko czas (znacznik zalewu, bez parametrów),
// a gdy plik miesiąca przekroczy limit wielkości, nie zapisujemy nic (przekierowanie działa dalej).
function pg_log($rec) {
  pg_ensure_dir();
  $f = pg_log_file($rec['t']);
  if (pg_cap_reached($f)) return false;
  $minute = date('YmdHi', $rec['t']);
  $limit = (int) pg_config()['limit_minuta'];
  $st = pg_update_state('minuta.php', function ($s) use ($minute) {
    return ['m' => $minute, 'n' => (isset($s['m']) && $s['m'] === $minute ? (int) $s['n'] : 0) + 1];
  });
  if ($st !== null && $limit > 0 && $st['n'] > $limit) $rec = ['t' => $rec['t'], 'flood' => 1];
  clearstatcache(true, $f);
  $new = !is_file($f) || @filesize($f) === 0; // pusty plik po nieudanym zapisie też dostaje linię PG_GUARD
  $line = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($line === false) return false;
  $ok = @file_put_contents($f, ($new ? PG_GUARD : '') . $line . "\n", FILE_APPEND | LOCK_EX) !== false;
  if ($new) pg_cleanup(); // nowy miesiąc: usuń zapisy starsze niż retencja
  return $ok;
}

// Czy plik wejść osiągnął limit wielkości (wtedy nowe wejścia nie są zapisywane).
function pg_cap_reached($f = null) {
  $f = $f === null ? pg_log_file() : $f;
  $cap = (float) pg_config()['limit_pliku_mb'];
  return $cap > 0 && is_file($f) && @filesize($f) > $cap * 1048576;
}

// Czy wejście liczy się jako odwiedziny człowieka (bez robotów, podglądów linków, HEAD i zalewu).
function pg_is_human($r) { return empty($r['bot']) && empty($r['pre']) && empty($r['head']) && empty($r['flood']); }

// Rodzaj identyfikatora kliknięcia (fbclid Meta dodaje do reklam i do zwykłych linków w swoich aplikacjach).
function pg_click_kind($r) {
  foreach (['gclid', 'gbraid', 'wbraid', 'gad_source', 'gad_campaignid', 'dclid'] as $k) if (!empty($r[$k])) return 'google';
  if (!empty($r['fbclid'])) return 'meta';
  if (!empty($r['ttclid'])) return 'tiktok';
  if (!empty($r['msclkid'])) return 'microsoft';
  return '';
}

/* ---------- GA4 (Measurement Protocol) ---------- */
// Zdarzenie bez identyfikatorów odwiedzającego: losowy client_id dla każdego wejścia (nigdzie nie zapisywany),
// bez IP i user-agenta odwiedzającego (wysyła serwer), bez ciasteczek, zgody reklamowe „DENIED”.
function pg_ga4_payload($r, $test = false) {
  $p = [];
  $src = $r['us'] !== '' ? $r['us'] : pg_config()['default_source'];
  $map = ['redirect_source' => $src, 'redirect_medium' => $r['um'], 'redirect_campaign' => $r['uc'], 'redirect_content' => $r['ux'],
          'redirect_term' => $r['ut'], 'redirect_referrer' => $r['ref'], 'redirect_device' => $r['dev'], 'redirect_app' => $r['app']];
  foreach ($map as $k => $v) if ($v !== '' && $v !== null) $p[$k] = pg_cut((string) $v, 100);
  $kind = pg_click_kind($r);
  $p['redirect_click_id'] = $kind !== '' ? $kind : 'brak';
  if ($test) { $p['debug_mode'] = 1; $p['engagement_time_msec'] = 100; $p['session_id'] = (string) time(); }
  return [
    'client_id' => random_int(100000000, 2147483647) . '.' . $r['t'],
    'timestamp_micros' => (string) ($r['t'] * 1000000),
    'consent' => ['ad_user_data' => 'DENIED', 'ad_personalization' => 'DENIED'],
    'events' => [['name' => $test ? 'przekierowanie_bilety_test' : 'przekierowanie_bilety', 'params' => $p]],
  ];
}

function pg_http_post($url, $body, $timeout = 3) {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_CONNECTTIMEOUT => 2, CURLOPT_TIMEOUT => $timeout]);
    $resp = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    if (PHP_VERSION_ID < 80000) curl_close($ch);
    return [$code, $resp === false ? $err : $resp];
  }
  $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $body, 'timeout' => $timeout, 'ignore_errors' => true]]);
  $fp = @fopen($url, 'r', false, $ctx);
  if (!$fp) return [0, 'brak połączenia'];
  $meta = stream_get_meta_data($fp);
  $resp = stream_get_contents($fp);
  fclose($fp);
  $code = 0;
  $headers = isset($meta['wrapper_data']) && is_array($meta['wrapper_data']) ? $meta['wrapper_data'] : [];
  foreach ($headers as $h) if (preg_match('~^HTTP/\S+\s+(\d{3})~', (string) $h, $m)) $code = (int) $m[1];
  return [$code, $resp === false ? '' : $resp];
}

function pg_ga4_url($debug = false) {
  $c = pg_config();
  return rtrim($c['ga4_endpoint'], '/') . ($debug ? '/debug' : '') . '/mp/collect?measurement_id=' . rawurlencode($c['ga4_id']) . '&api_secret=' . rawurlencode($c['ga4_secret']);
}

function pg_ga4_send($r) {
  list($code, $resp) = pg_http_post(pg_ga4_url(), json_encode(pg_ga4_payload($r), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  return ($code >= 200 && $code < 300) ? true : ('HTTP ' . $code . ' ' . pg_clean(is_string($resp) ? $resp : '', 120));
}

// Pliki z wejściami, które mogą jeszcze trafić do GA4 (GA4 przyjmuje zdarzenia do 72 godzin wstecz).
function pg_ga4_files() {
  $out = [];
  foreach ([strtotime('-71 hours'), time()] as $t) { $f = pg_log_file($t); if (is_file($f) && !in_array($f, $out, true)) $out[] = $f; }
  return $out;
}

// Wysyła do GA4 zaległe wejścia (najwyżej $max naraz, z ostatnich 71 godzin). Postęp: offset dla każdego
// pliku w ga4-stan.php. Jeden proces naraz. Gdy stanu nie da się zapisać, nic nie wysyła (bez duplikatów).
// Nigdy nie wysyła wejść sprzed włączenia wysyłki (od_t).
function pg_ga4_flush($max = 20) {
  $c = pg_config();
  if ($c['ga4_secret'] === '' || $c['ga4_id'] === '') return 0;
  $files = pg_ga4_files();
  if (!$files) return 0;
  pg_ensure_dir();
  $lock = @fopen(pg_dane() . '/ga4.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) return 0;
  $state = pg_read_state('ga4-stan.php');
  if (!pg_write_state('ga4-stan.php', $state)) { flock($lock, LOCK_UN); fclose($lock); return 0; }
  $offsets = isset($state['offsety']) && is_array($state['offsety']) ? $state['offsety'] : [];
  $from = isset($state['od_t']) ? (int) $state['od_t'] : 0;
  $sent = 0; $stop = false; $keep = [];
  foreach ($files as $f) {
    $key = basename($f);
    $off = isset($offsets[$key]) ? (int) $offsets[$key] : 0;
    $fh = @fopen($f, 'r');
    if ($fh) {
      fseek($fh, $off);
      while (!$stop && $sent < $max && ($line = fgets($fh)) !== false) {
        if (substr($line, -1) !== "\n") break; // linia jeszcze w trakcie zapisu
        $r = json_decode($line, true);
        if (is_array($r) && isset($r['t']) && pg_is_human($r) && empty($r['gpc']) && (int) $r['t'] >= $from && time() - (int) $r['t'] < 71 * 3600) {
          $res = pg_ga4_send($r);
          if ($res !== true) { $state['blad'] = $res; $state['blad_t'] = time(); $stop = true; break; }
          $sent++;
          $state['ok_t'] = time();
          $state['blad'] = '';
        }
        $off = ftell($fh);
      }
      fclose($fh);
    }
    $keep[$key] = $off;
  }
  $state['offsety'] = $keep;
  $state['wyslane'] = (isset($state['wyslane']) ? (int) $state['wyslane'] : 0) + $sent;
  pg_write_state('ga4-stan.php', $state);
  flock($lock, LOCK_UN); fclose($lock);
  return $sent;
}

// Przy włączeniu wysyłki: zaczynamy od tego momentu (wcześniejsze wejścia nie trafiają do GA4).
function pg_ga4_start() {
  pg_ensure_dir();
  $lock = @fopen(pg_dane() . '/ga4.lock', 'c');
  if ($lock) flock($lock, LOCK_EX);
  $state = pg_read_state('ga4-stan.php');
  $offsets = [];
  foreach (pg_ga4_files() as $f) { clearstatcache(true, $f); $offsets[basename($f)] = (int) @filesize($f); }
  $state['offsety'] = $offsets;
  $state['blad'] = '';
  $state['od_t'] = time();
  $ok = pg_write_state('ga4-stan.php', $state);
  if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
  return $ok;
}

// Liczba wejść czekających na wysyłkę do GA4.
function pg_ga4_pending() {
  $state = pg_read_state('ga4-stan.php');
  $offsets = isset($state['offsety']) && is_array($state['offsety']) ? $state['offsety'] : [];
  $from = isset($state['od_t']) ? (int) $state['od_t'] : 0;
  $n = 0;
  foreach (pg_ga4_files() as $f) {
    $fh = @fopen($f, 'r');
    if (!$fh) continue;
    fseek($fh, isset($offsets[basename($f)]) ? (int) $offsets[basename($f)] : 0);
    while (($line = fgets($fh)) !== false) { $r = json_decode($line, true); if (is_array($r) && isset($r['t']) && pg_is_human($r) && empty($r['gpc']) && (int) $r['t'] >= $from && time() - (int) $r['t'] < 71 * 3600) $n++; }
    fclose($fh);
  }
  return $n;
}

// Data pierwszego zapisanego wejścia (RRRR-MM-DD) albo null, gdy nie ma żadnego.
function pg_first_visit() {
  $files = (array) glob(pg_dane() . '/wejscia-*.php');
  sort($files);
  foreach ($files as $f) {
    $fh = @fopen($f, 'r');
    if (!$fh) continue;
    while (($line = fgets($fh)) !== false) { $r = json_decode($line, true); if (is_array($r) && isset($r['t'])) { fclose($fh); return date('Y-m-d', (int) $r['t']); } }
    fclose($fh);
  }
  return null;
}

// Najstarszy przechowywany miesiąc (RRRR-MM): bieżący i retencja_mies pełnych miesięcy wstecz.
function pg_oldest_month() {
  return date('Y-m', strtotime(date('Y-m-01') . ' -' . (int) pg_config()['retencja_mies'] . ' months'));
}
// Usuwa zapisy starsze niż retencja (przy pierwszym wejściu w nowym miesiącu i przy otwarciu panelu).
function pg_cleanup() {
  $oldest = pg_oldest_month();
  foreach ((array) glob(pg_dane() . '/wejscia-*.php') as $f) {
    if (preg_match('/wejscia-(\d{4}-\d{2})\.php$/', $f, $m) && $m[1] < $oldest) @unlink($f);
  }
}
