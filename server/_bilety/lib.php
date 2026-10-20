<?php
/*
 * Krótki adres /bilety: adres docelowy, zapis wejść i wysyłka do GA4. PHP 7.0+.
 *
 * Prywatność: zapisujemy tylko datę, parametry kampanii (utm_*), domenę strony odsyłającej,
 * rodzaj urządzenia i aplikacji oraz to, czy w adresie był identyfikator kliknięcia reklamy.
 * Bez adresu IP, bez pełnego user-agenta, bez wartości fbclid/gclid i bez ciasteczek.
 */
if (!defined('PG_BILETY')) { http_response_code(403); exit; }

define('PG_DIR', __DIR__);
define('PG_DANE', __DIR__ . '/dane');
date_default_timezone_set('Europe/Warsaw');

// Parametry przekazywane do eBilet oprócz utm_*: identyfikatory kliknięć reklam.
const PG_CLICK_IDS = ['fbclid', 'gclid', 'gbraid', 'wbraid', 'ttclid', 'msclkid'];
const PG_UTM_ORDER = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function pg_config() {
  static $c = null;
  if ($c !== null) return $c;
  $c = [
    'target' => 'https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme',
    'partner' => 'l2lsp',
    'fragment' => 'padre-guilherme_155685,1622',
    'default_source' => 'direct',   // gdy link kampanii nie ma utm_source
    'ga4_id' => 'G-MQFK04FB3F',
    'ga4_secret' => '',             // klucz API Measurement Protocol (wpisywany w panelu)
    'ga4_endpoint' => 'https://www.google-analytics.com',
    'panel_hash' => '',             // hash hasła do panelu (config.php albo zmiana w panelu)
    'retencja_mies' => 14,          // tyle miesięcy trzymamy zapisy wejść
  ];
  $f = PG_DIR . '/config.php';
  if (is_file($f)) { $x = include $f; if (is_array($x)) $c = array_merge($c, $x); }
  $u = pg_read_json(PG_DANE . '/ustawienia.json');
  if (is_array($u)) $c = array_merge($c, array_intersect_key($u, ['ga4_secret' => 1, 'panel_hash' => 1]));
  return $c;
}

function pg_read_json($f) {
  if (!is_file($f)) return null;
  $s = @file_get_contents($f);
  if ($s === false || $s === '') return null;
  return json_decode($s, true);
}

function pg_write_json($f, $data) {
  pg_ensure_dir();
  $tmp = $f . '.' . bin2hex(random_bytes(4)) . '.tmp';
  if (@file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) return false;
  @chmod($tmp, 0600);
  return @rename($tmp, $f);
}

// Katalog danych: niedostępny z internetu (deny w .htaccess wyżej i tutaj).
function pg_ensure_dir() {
  if (!is_dir(PG_DANE)) @mkdir(PG_DANE, 0700, true);
  if (is_dir(PG_DANE) && !is_file(PG_DANE . '/.htaccess')) {
    @file_put_contents(PG_DANE . '/.htaccess', "Require all denied\n");
    @file_put_contents(PG_DANE . '/index.html', '');
  }
}

function pg_clean($s, $max) {
  $s = (string) $s;
  if (!preg_match('//u', $s)) $s = preg_replace('/[\x80-\xFF]/', '', $s); // niepoprawne UTF-8
  $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s));
  return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
}

// Z parametrów adresu: utm_* i identyfikatory kliknięć (reszta jest pomijana).
function pg_params($get) {
  $utm = []; $click = [];
  foreach ($get as $k => $v) {
    if (!is_string($v) || !is_string($k)) continue;
    $k = strtolower($k);
    $v = pg_clean($v, 200);
    if ($v === '') continue;
    if (preg_match('/^utm_[a-z0-9_]{1,30}$/', $k)) $utm[$k] = $v;
    elseif (in_array($k, PG_CLICK_IDS, true)) $click[$k] = $v;
  }
  return [$utm, $click];
}

// Adres eBilet: zawsze partner=l2lsp, parametry kampanii z linku (utm_source=direct, gdy go brak),
// identyfikatory kliknięć i kotwica wydarzenia. Adres bez „/” przed „?” (wersja z ukośnikiem gubi utm_source).
function pg_target($utm, $click) {
  $c = pg_config();
  $q = ['partner' => $c['partner']];
  if (!isset($utm['utm_source'])) $utm['utm_source'] = $c['default_source'];
  foreach (PG_UTM_ORDER as $k) if (isset($utm[$k])) { $q[$k] = $utm[$k]; unset($utm[$k]); }
  foreach ($utm as $k => $v) $q[$k] = $v;
  foreach ($click as $k => $v) $q[$k] = $v;
  return $c['target'] . '?' . http_build_query($q, '', '&', PHP_QUERY_RFC3986) . '#' . $c['fragment'];
}

function pg_ref_host($ref) {
  $h = parse_url((string) $ref, PHP_URL_HOST);
  if (!is_string($h) || $h === '') return '';
  return pg_clean(preg_replace('/^www\./', '', strtolower($h)), 100);
}

// Rodzaj klienta z user-agenta (sam user-agent nie jest zapisywany).
function pg_client($ua) {
  $ua = (string) $ua;
  $bot = $ua === '' || preg_match('~bot\b|bot/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-external|whatsapp|telegram|discord|skypeuripreview|embedly|preview|google-|mediapartners|curl/|wget/|python|go-http|java/|okhttp|axios|node-fetch|headlesschrome|lighthouse|pingdom|uptime|monitor~i', $ua);
  $app = '';
  if (preg_match('~Instagram~i', $ua)) $app = 'instagram';
  elseif (preg_match('~FBAN/Messenger|MessengerForiOS|Orca-Android~i', $ua)) $app = 'messenger';
  elseif (preg_match('~FBAN|FBAV|FB_IAB|FBIOS|FB4A~', $ua)) $app = 'facebook';
  elseif (preg_match('~musical_ly|TikTok|BytedanceWebview|trill_~i', $ua)) $app = 'tiktok';
  elseif (preg_match('~Snapchat~i', $ua)) $app = 'snapchat';
  elseif (preg_match('~LinkedInApp~i', $ua)) $app = 'linkedin';
  elseif (preg_match('~Threads|Barcelona~', $ua)) $app = 'threads';
  if ($bot) $dev = 'bot';
  elseif (preg_match('~iPad|Tablet|Android(?!.*Mobi)~i', $ua)) $dev = 'tablet';
  elseif (preg_match('~Mobi|iPhone|iPod|Android|Windows Phone~i', $ua)) $dev = 'telefon';
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
  $r = [
    't' => time(),
    'us' => isset($utm['utm_source']) ? $utm['utm_source'] : '',
    'um' => isset($utm['utm_medium']) ? $utm['utm_medium'] : '',
    'uc' => isset($utm['utm_campaign']) ? $utm['utm_campaign'] : '',
    'ux' => isset($utm['utm_content']) ? $utm['utm_content'] : '',
    'ut' => isset($utm['utm_term']) ? $utm['utm_term'] : '',
    'ref' => pg_ref_host(isset($server['HTTP_REFERER']) ? $server['HTTP_REFERER'] : ''),
    'dev' => $cl['dev'], 'os' => $cl['os'], 'app' => $cl['app'], 'bot' => $cl['bot'],
    'pre' => preg_match('~prefetch|prerender|preview~i', $purpose) ? 1 : 0,
    'head' => (isset($server['REQUEST_METHOD']) && $server['REQUEST_METHOD'] === 'HEAD') ? 1 : 0,
  ];
  foreach (PG_CLICK_IDS as $k) if (isset($click[$k])) $r[$k] = 1; // tylko informacja „był”, bez wartości
  return $r;
}

function pg_log_file($ts = null) { return PG_DANE . '/wejscia-' . date('Y-m', $ts === null ? time() : $ts) . '.ndjson'; }

function pg_log($rec) {
  pg_ensure_dir();
  $line = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($line === false) return false;
  return @file_put_contents(pg_log_file($rec['t']), $line . "\n", FILE_APPEND | LOCK_EX) !== false;
}

// Czy wejście liczy się jako odwiedziny człowieka (bez robotów, podglądów linków i zapytań HEAD).
function pg_is_human($r) { return empty($r['bot']) && empty($r['pre']) && empty($r['head']); }

/* ---------- GA4 (Measurement Protocol) ---------- */
// Zdarzenie bez danych osobowych: losowy client_id dla każdego wejścia (nigdzie nie zapisywany),
// bez IP i user-agenta odwiedzającego (wysyła serwer), bez ciasteczek, zgody reklamowe „DENIED”.
function pg_ga4_payload($r, $test = false) {
  $p = [];
  $src = $r['us'] !== '' ? $r['us'] : pg_config()['default_source'];
  $map = ['redirect_source' => $src, 'redirect_medium' => $r['um'], 'redirect_campaign' => $r['uc'], 'redirect_content' => $r['ux'],
          'redirect_term' => $r['ut'], 'redirect_referrer' => $r['ref'], 'redirect_device' => $r['dev'], 'redirect_app' => $r['app']];
  foreach ($map as $k => $v) if ($v !== '' && $v !== null) $p[$k] = function_exists('mb_substr') ? mb_substr($v, 0, 100, 'UTF-8') : substr($v, 0, 100);
  $p['redirect_ad_click'] = (!empty($r['fbclid']) ? 'meta' : (!empty($r['gclid']) || !empty($r['gbraid']) || !empty($r['wbraid']) ? 'google' : (!empty($r['ttclid']) ? 'tiktok' : 'brak')));
  if ($test) { $p['debug_mode'] = 1; $p['engagement_time_msec'] = 100; $p['session_id'] = (string) time(); }
  return [
    'client_id' => random_int(100000000, 2147483647) . '.' . $r['t'],
    'timestamp_micros' => (string) ($r['t'] * 1000000),
    'non_personalized_ads' => true,
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
    curl_close($ch);
    return [$code, $resp === false ? $err : $resp];
  }
  $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $body, 'timeout' => $timeout, 'ignore_errors' => true]]);
  $resp = @file_get_contents($url, false, $ctx);
  $code = 0;
  if (isset($http_response_header[0]) && preg_match('~\s(\d{3})\s~', $http_response_header[0], $m)) $code = (int) $m[1];
  return [$code, $resp === false ? 'brak odpowiedzi' : $resp];
}

function pg_ga4_url($debug = false) {
  $c = pg_config();
  return rtrim($c['ga4_endpoint'], '/') . ($debug ? '/debug' : '') . '/mp/collect?measurement_id=' . rawurlencode($c['ga4_id']) . '&api_secret=' . rawurlencode($c['ga4_secret']);
}

function pg_ga4_send($r) {
  list($code, $resp) = pg_http_post(pg_ga4_url(), json_encode(pg_ga4_payload($r), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  return ($code >= 200 && $code < 300) ? true : ('HTTP ' . $code . ' ' . pg_clean(is_string($resp) ? $resp : '', 120));
}

// Wysyła do GA4 zaległe wejścia z bieżącego miesiąca (najwyżej $max naraz, tylko z ostatnich 71 godzin:
// GA4 przyjmuje zdarzenia do 72 godzin wstecz). Postęp w dane/ga4-stan.json, jeden proces naraz.
function pg_ga4_flush($max = 20) {
  $c = pg_config();
  if ($c['ga4_secret'] === '' || $c['ga4_id'] === '') return 0;
  $f = pg_log_file();
  if (!is_file($f)) return 0;
  pg_ensure_dir();
  $lock = @fopen(PG_DANE . '/ga4.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) return 0;
  $state = pg_read_json(PG_DANE . '/ga4-stan.json');
  if (!is_array($state)) $state = [];
  $key = basename($f);
  $off = (isset($state['plik']) && $state['plik'] === $key) ? (int) $state['offset'] : 0;
  $fh = @fopen($f, 'r');
  $sent = 0;
  if ($fh) {
    fseek($fh, $off);
    while ($sent < $max && ($line = fgets($fh)) !== false) {
      if (substr($line, -1) !== "\n") break; // linia jeszcze w trakcie zapisu
      $r = json_decode($line, true);
      if (is_array($r) && pg_is_human($r) && time() - (int) $r['t'] < 71 * 3600) {
        $res = pg_ga4_send($r);
        if ($res !== true) { $state['blad'] = $res; $state['blad_t'] = time(); break; }
        $sent++;
        $state['ok_t'] = time();
        $state['blad'] = '';
      }
      $off = ftell($fh);
    }
    fclose($fh);
  }
  $state['plik'] = $key; $state['offset'] = $off;
  $state['wyslane'] = (isset($state['wyslane']) ? (int) $state['wyslane'] : 0) + $sent;
  pg_write_json(PG_DANE . '/ga4-stan.json', $state);
  flock($lock, LOCK_UN); fclose($lock);
  return $sent;
}

// Liczba wejść czekających na wysyłkę do GA4 w bieżącym miesiącu.
function pg_ga4_pending() {
  $f = pg_log_file();
  if (!is_file($f)) return 0;
  $state = pg_read_json(PG_DANE . '/ga4-stan.json');
  $off = (is_array($state) && isset($state['plik']) && $state['plik'] === basename($f)) ? (int) $state['offset'] : 0;
  $fh = @fopen($f, 'r');
  if (!$fh) return 0;
  fseek($fh, $off);
  $n = 0;
  while (($line = fgets($fh)) !== false) { $r = json_decode($line, true); if (is_array($r) && pg_is_human($r) && time() - (int) $r['t'] < 71 * 3600) $n++; }
  fclose($fh);
  return $n;
}

// Usuwa zapisy starsze niż retencja (wywoływane z panelu i raz na jakiś czas przy wejściu).
function pg_cleanup() {
  $limit = date('Y-m', strtotime('-' . (int) pg_config()['retencja_mies'] . ' months', strtotime(date('Y-m-01'))));
  foreach ((array) glob(PG_DANE . '/wejscia-*.ndjson') as $f) {
    if (preg_match('/wejscia-(\d{4}-\d{2})\.ndjson$/', $f, $m) && $m[1] < $limit) @unlink($f);
  }
}
