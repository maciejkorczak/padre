<?php
/*
 * padreguilherme.pl/bilety: natychmiastowe przekierowanie (302) do sprzedaży biletów w eBilet
 * z partner=l2lsp, parametrami kampanii (utm_*; utm_source=direct, gdy go brak) i fbclid/gclid,
 * oraz zapis wejścia do statystyk (/statystyki/). Bez ciasteczek i bez adresu IP.
 * Gdy cokolwiek zawiedzie, przekierowanie i tak działa (adres awaryjny poniżej).
 */
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
} catch (Throwable $e) { /* zostaje adres awaryjny */ }

header('Location: ' . $target, true, 302);
header('Cache-Control: no-store, private');
header('X-Robots-Tag: noindex, nofollow');
header('Content-Length: 0');

if ($ready) {
  try { pg_log(pg_record($utm, $click, $_SERVER)); } catch (Throwable $e) { /* statystyki nie blokują przekierowania */ }
  // Odpowiedź jest już u odwiedzającego; wysyłka do GA4 i porządki dzieją się po jej zakończeniu.
  if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
    try { pg_ga4_flush(5); if (random_int(1, 200) === 1) pg_cleanup(); } catch (Throwable $e) { }
  }
}
