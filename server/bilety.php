<?php
/*
 * padreguilherme.pl/bilety: natychmiastowe przekierowanie (302) do sprzedaży biletów w eBilet
 * z partner=l2lsp, parametrami kampanii (utm_*; utm_source=direct, gdy go brak) i identyfikatorami
 * kliknięć (fbclid, gclid...), oraz zapis wejścia do statystyk (/statystyki/). Bez ciasteczek i bez IP.
 * Gdy cokolwiek zawiedzie, przekierowanie i tak działa (adres awaryjny poniżej).
 */
ob_start(); // ostrzeżenia PHP, BOM ani spacje w plikach nie mogą zablokować nagłówka Location
define('PG_BILETY', 1);
$target = 'https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme?partner=l2lsp&utm_source=direct#padre-guilherme_155685,1622';
$utm = []; $click = []; $ready = false;
try {
  if (is_file(__DIR__ . '/_bilety/lib.php')) {
    include __DIR__ . '/_bilety/lib.php';
    list($utm, $click) = pg_params($_GET);
    $target = pg_target($utm, $click);
    $ready = true;
  }
} catch (Throwable $e) { $ready = false; }
if (!$ready) {
  // Awaryjnie (bez lib.php): te same parametry kampanii i identyfikatory kliknięć, bez statystyk.
  $q = ['partner' => 'l2lsp'];
  foreach ($_GET as $k => $v) {
    $k = is_string($k) ? preg_replace('/^(amp;)+/i', '', $k) : $k;
    if (is_string($k) && is_string($v) && $v !== '' && preg_match('~^(utm_[a-z0-9_]{1,30}|fbclid|gclid|gbraid|wbraid|gad_source|gad_campaignid|dclid|ttclid|msclkid)$~i', $k)) $q[strtolower($k)] = substr($v, 0, 1000);
  }
  if (!isset($q['utm_source']) || $q['utm_source'] === '') $q['utm_source'] = 'direct';
  $target = 'https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme?' . http_build_query($q, '', '&', PHP_QUERY_RFC3986) . '#padre-guilherme_155685,1622';
}

while (ob_get_level() > 0 && @ob_end_clean()) {}
header('Location: ' . $target, true, 302);
header('Cache-Control: no-store, private');
header('X-Robots-Tag: noindex, nofollow');
header('Content-Length: 0');

if ($ready) {
  // Z PHP-FPM odpowiedź idzie do odwiedzającego od razu; zapis i wysyłka do GA4 dzieją się już po niej.
  $fpm = function_exists('fastcgi_finish_request');
  if ($fpm) fastcgi_finish_request();
  ob_start();
  try { pg_log(pg_record($utm, $click, $_SERVER)); } catch (Throwable $e) { /* statystyki nie blokują przekierowania */ }
  if ($fpm) { try { pg_ga4_flush(5); } catch (Throwable $e) { } }
  ob_end_clean();
}
