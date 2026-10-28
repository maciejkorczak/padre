# Wdrożenie padreguilherme.pl

Stan na 19.10.2026, po uruchomieniu strony.

## 1. Stan (19.10.2026, 21:30): strona działa

Aktualizacja 20.10.2026: wgrana wersja po audycie (wszystkie 240 plików zgodne z paczką, `/bilety` działa, IndexNow zgłoszony: HTTP 202).

Aktualizacja 21.10.2026: wgrane `/bilety` ze statystykami (paczka 7 plików). Sprawdzone na żywo: 302 z `partner=l2lsp`, wszystkimi `utm_*`, `fbclid` i `gclid` (też `/bilety/`, `/BILETY`, www, http), `Cache-Control: no-store`, `_bilety` zablokowane (403), panel `/statystyki/` działa (logowanie, zapis wejść, CSV), diagnostyka: PHP 8.5.0, zapis danych: tak, PHP-FPM: tak, cURL: tak, GA4 wyłączone. 5 wejść testowych z 21.10 ma źródło `test_wdrozenie` (jedno bez parametrów: `direct`).

| Co | Stan |
|----|------|
| Adres | **https://padreguilherme.pl** (www, http i /index.html przekierowują 301 na ten adres) |
| DNS | A `46.242.241.87` (SERWER2670951), `www` → CNAME na domenę główną, TTL 60 s. Potwierdzone w Google DNS i Cloudflare. |
| Certyfikat | homeSSL (home.pl) dla padreguilherme.pl i www, ważny do 22.03.2027, odnawiany w ramach subskrypcji do 5.09.2027. |
| Serwer | SERWER2670951, Ustawienia WWW: „Główny katalog na serwerze”. W FileZilli (konto `padre@padreguilherme.pl`) to folder **`/public_html`** (stan 20.10.2026). |
| Inne foldery w `/public_html` | `ebiletconfidential` (strona Press Accreditations) i `tmp` (systemowy): nie usuwać. `ebiletconfidential` otwiera się też pod padreguilherme.pl/ebiletconfidential/. |
| WAF | Wyłączony. Strona jest statyczna; PHP (bez bazy) obsługuje tylko `/bilety` i panel `/statystyki/`. |

## 2. Dostęp FTP

- Serwer `serwer2670951.hosting-home.pl`, port 21 (FTPS), login `padre@padreguilherme.pl` (małymi literami).
- Po zalogowaniu FileZilla pokazuje `/` z folderami `backup`, `logs`, `padreguilherme`, `public_html`, `svn_repo`. **Strona jest w `/public_html`** (obok `ebiletconfidential` i `tmp`). Folder `/padreguilherme` to pozostałość po pierwszej próbie z 19.10, nieużywana przez domenę: nie wgrywać tam plików.
- Menedżer plików home.pl (WebFTP) pokazuje osobne drzewo z folderem `/padreguilherme` z pierwszej próby („podkatalog z separacją”). Ten folder nie jest używany przez domenę.

## 3. Aktualizacja strony

1. `npm run dist` → `dist/padreguilherme.pl.zip` (246 plików, ok. 18 MB; stan 20.10.2026, z `/bilety` i panelem statystyk). Gdy zmienia się tylko `/bilety` i panel, wystarczy mała paczka z sekcji 3a.
2. Rozpakuj i wgraj **zawartość** do `/public_html` przez FileZillę, z nadpisaniem. Po lewej musi być rozpakowany folder paczki (nie inny projekt). Nie ruszaj `ebiletconfidential` ani `tmp`.
3. Pliki ukryte są w paczce: `.htaccess` w katalogu głównym, `_bilety/.htaccess` i `statystyki/.htaccess`. Na Macu: w Finderze Cmd+Shift+. pokazuje ukryte pliki.
4. Nigdy nie usuwaj na serwerze folderu `_bilety/dane` (statystyki, ustawienia panelu). Paczka go nie zawiera, więc wgranie z nadpisaniem go nie rusza.

`.htaccess` (sprawdzony na Apache 2.4 i na żywym serwerze):
- **krótki adres dla kampanii** `https://padreguilherme.pl/bilety` (też `/bilety/`, www, http, wielkie litery): obsługuje go `bilety.php` (sekcja 3a). Gdyby pliku `bilety.php` nie było, `.htaccess` sam przekierowuje (302) do eBilet z `partner=l2lsp` i całym ciągiem parametrów z linku, tylko bez statystyk (link z własnym `partner=` traci wtedy parametry, a link wklejony z HTML z `&amp;` gubi kolejne `utm_*`),
- przekierowuje `http://` i `www.` na `https://padreguilherme.pl/` (301, parametry UTM zostają),
- przekierowuje `/index.html` na `/`,
- ustawia typy plików AVIF i WOFF2,
- kompresuje pliki tekstowe (gzip),
- długi cache tylko dla `/assets/` (pliki są wersjonowane), strona główna zawsze świeża; inne foldery na serwerze zostają bez zmian,
- blokuje listowanie katalogów i dostęp do plików ukrytych.

## 3a. Krótki adres /bilety i panel statystyk

**Przekierowanie** (`bilety.php`, decyzja Marka 20.10.2026): od razu 302 do
`https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme?partner=l2lsp&utm_source=direct#padre-guilherme_155685,1622`.
- Zawsze `partner=l2lsp` (nawet gdy link ma inny `partner`).
- Parametry kampanii z linku przechodzą dalej bez zmian: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id` i inne `utm_*`. `utm_source=direct` jest dopisywany tylko, gdy link go nie ma (dzięki temu w eBilet widać źródło kampanii; jeśli ma być zawsze `direct`, to mała zmiana w `pg_target` w `server/_bilety/lib.php`). Do potwierdzenia z Markiem/eBilet: prowizja partnera nie zależy od `utm_source=direct`.
- Identyfikatory kliknięć przechodzą dalej: `fbclid`, `gclid`, `gbraid`, `wbraid`, `gad_source`, `gad_campaignid`, `dclid`, `ttclid`, `msclkid`. Inne parametry są pomijane. eBilet zachowuje je wszystkie (sprawdzone 20.10, bez dalszego przekierowania).
- Adres bez „/” przed „?”, bo wersja z ukośnikiem przekierowuje w eBilet i gubi `utm_source` (sprawdzone 20.10).
- Czas odpowiedzi ok. 2-5 ms (test lokalny na Apache + PHP-FPM). Z PHP-FPM odpowiedź wychodzi przed zapisem do statystyk; gdy cokolwiek zawiedzie (brak pliku, pełny dysk, brak zapisu), przekierowanie działa dalej.
- **Google Ads**: nie ustawiaj `padreguilherme.pl/bilety` jako adresu docelowego reklamy. Google odrzuca reklamy, których adres przekierowuje do innej domeny („Niezgodność strony docelowej”). W Google Ads użyj bezpośrednio linku eBilet (z `partner=l2lsp` i własnymi UTM) albo strony głównej; takie kliknięcia nie trafią do panelu. `/bilety` jest dla reklam Meta/Instagram, bio, relacji, newslettera, kodów QR i druku.

**Statystyki**: https://padreguilherme.pl/statystyki/ (hasło: przekazane osobno, nie w repozytorium; można je zmienić w panelu).
- Liczba wejść (dziennie, wykres i tabela), zakresy: dziś, wczoraj, ten tydzień, 7 i 30 dni, ten miesiąc, wszystko (od pierwszego wejścia) albo własne daty; źródło, medium, kampania, treść (kreacja), zestawienie źródło / medium / kampania / treść, strona odsyłająca, aplikacja (Instagram, Facebook, Messenger, TikTok...), urządzenie, system, identyfikator kliknięcia (Meta, Google, TikTok, Microsoft), ostatnie 50 wejść, filtry po kliknięciu wartości, eksport CSV (Excel), generator linków kampanii.
- Roboty, podglądy linków (WhatsApp, Messenger, Slack...), prefetch i zapytania inne niż GET (np. HEAD) są zapisywane osobno i nie liczą się do wejść. CSV zawiera je z oznaczeniem w kolumnie `pominiete` (suma w panelu = wiersze z pustą kolumną `pominiete`).
- W pierwszych dniach porównaj liczby z Meta („Kliknięcia linku”, „Wyświetlenia strony docelowej”): aplikacje Meta czasem wczytują link z wyprzedzeniem, co może przesunąć część kliknięć do „podglądów”.
- Ochrona przed zalewem: powyżej 3000 wejść na minutę zapisywany jest tylko czas (bez parametrów, w panelu „zalew”), a gdy plik miesiąca przekroczy 100 MB, wejścia nie są zapisywane. Przekierowanie działa zawsze.
- Prywatność: bez adresu IP, bez pełnego user-agenta, bez ciasteczek odwiedzających, bez wartości `fbclid`/`gclid` (tylko „był”). Wartości UTM małymi literami, adresy e-mail i numery telefonów (z „+” albo w grupach 3-3-3) są usuwane ze statystyk. Zapisy: bieżący miesiąc i 14 poprzednich. **Nigdy nie wpisuj w linki danych osobowych ani kodów pojedynczych odbiorców** (numer klienta, znaczniki newslettera typu `*|UNIQID|*` czy `{{contact.id}}`): jeden link na grupę odbiorców. Same ciągi cyfr nie są usuwane.
- Pliki: `_bilety/lib.php` (logika), `_bilety/config.php` (hash hasła, generowany przy budowie z `server/_bilety/config.local.php`, którego nie ma w repozytorium), `_bilety/dane/` (tworzony przez PHP przy pierwszym wejściu: wejścia `wejscia-RRRR-MM.php`, ustawienia panelu `ustawienia.php`, stany `ga4-stan.php`, `logowania.php`, `minuta.php`; folder `sesje/` z pierwszej wersji nie jest już używany). Dostęp z internetu do `_bilety` jest zablokowany (`.htaccess`, sprawdzone, że home.pl je stosuje); dodatkowo pliki danych mają rozszerzenie `.php` i zaczynają się od `<?php exit; ?>`, więc nawet bez `.htaccess` nic nie pokazują.
- Logowanie: 5 nieudanych prób z jednego adresu = 15 minut przerwy (łącznie najwyżej 50 prób na 15 minut). Po zalogowaniu przeglądarka dostaje podpisane ciasteczko (ważne 8 godzin, tylko dla `/statystyki/`), bez plików sesji na serwerze: na dysku home.pl zapis sesji PHP bywał niewidoczny dla kolejnego zapytania i panel po zalogowaniu czasem znów pokazywał logowanie (poprawione 22.10.2026). Zmiana hasła wylogowuje inne urządzenia.
- Wymagane PHP 7.0 lub nowsze (zalecane 8.x; sprawdzone na 7.0-8.5). Na starszym PHP przekierowanie działa, ale statystyki nie.

**GA4 (opcjonalnie, domyślnie wyłączone)**: po wpisaniu w panelu klucza API Measurement Protocol każde wejście od tej chwili (bez robotów, podglądów i sygnału „nie śledź”) trafia do GA4 G-MQFK04FB3F jako zdarzenie `przekierowanie_bilety` z parametrami `redirect_source`, `redirect_medium`, `redirect_campaign`, `redirect_content`, `redirect_term`, `redirect_referrer`, `redirect_app`, `redirect_device`, `redirect_click_id`. Wysyła serwer: bez ciasteczek, IP i przeglądarki odwiedzającego, z losowym identyfikatorem dla każdego wejścia i zgodami reklamowymi „DENIED”. Google otrzymuje jednak czas i parametry kampanii każdego wejścia, także osób, które na stronie odmówiły zgody (banera przy /bilety nie ma). Włączyć dopiero po zmianie polityki prywatności i banera oraz akceptacji prawnika (DO-POTWIERDZENIA, punkt G; projekt tekstu: docs/PRYWATNOSC-BILETY.md). GA4 niewiele tu dodaje: każde wejście to w GA4 osobny użytkownik bez sesji, a wszystkie dane są w panelu. Bez PHP-FPM wysyłka nie dzieje się sama: przycisk „Wyślij zaległe” co najmniej raz na 3 dni (GA4 przyjmuje zdarzenia do 72 godzin wstecz).

**Wgranie tej zmiany (20.10.2026)**: paczka `padre-bilety-statystyki.zip` (tworzy ją `npm run dist` w folderze `dist/`; 7 plików: `.htaccess`, `bilety.php`, `_bilety/.htaccess`, `_bilety/lib.php`, `_bilety/config.php`, `statystyki/.htaccess`, `statystyki/index.php`). Pozostałe pliki na serwerze są aktualne. Nie wgrywaj roboczego folderu `dist/padreguilherme.pl` z komputera dewelopera bez ponownego `npm run dist` (w czasie testów jego `config.php` wskazuje lokalną atrapę GA4).
1. Przed wgraniem: w panelu home.pl sprawdź wersję PHP domeny (8.x) i pobierz z serwera obecny `/public_html/.htaccess` jako kopię (np. `htaccess-kopia-20-10.txt` na swoim komputerze).
2. Wgraj zawartość paczki do `/public_html` z nadpisaniem, z plikami ukrytymi.

**Po wgraniu sprawdź** (raz, przed przepięciem kampanii):
1. W zwykłej przeglądarce (telefon albo komputer, nie curl) otwórz `https://padreguilherme.pl/bilety?utm_source=test&utm_campaign=sprawdzenie`. Otwiera się eBilet; w pasku adresu ma być `partner=l2lsp&utm_source=test&utm_campaign=sprawdzenie`.
2. Panel `https://padreguilherme.pl/statystyki/`: w „Ostatnie wejścia” jest `test / sprawdzenie`, na dole „zapis danych: tak”. Jeśli „NIE”: napisz do pomocy home.pl, że PHP musi móc zapisywać w folderze `_bilety` (nie ustawiaj 777).
3. Jeśli w panelu nie ma wejścia, a przekierowanie działa, to działa przekierowanie awaryjne z `.htaccess` (bez statystyk): sprawdź, czy wgrał się `bilety.php` i nowy `.htaccess`. Technicznie (Terminal na Macu albo Linux): `curl -s -o /dev/null -D - -A 'Mozilla/5.0 (test)' 'https://padreguilherme.pl/bilety?utm_source=test'` pokazuje `Cache-Control: no-store, private` tylko z `bilety.php` (zapytanie `curl -sI` też działa, ale w panelu liczy się jako robot).
4. Strona główna `https://padreguilherme.pl/` i `https://padreguilherme.pl/ebiletconfidential/` otwierają się jak wcześniej.
5. W FileZilli widać folder `_bilety/dane` i da się w nim usuwać pliki (potrzebne do odblokowania panelu, niżej). Na próbę usuń `minuta.php` (odtworzy się sam przy następnym wejściu); nie usuwaj na próbę innych plików.
6. Wejścia testowe zostają w sumach; obejrzysz je filtrem po źródle `test`. Diagnostyka na dole panelu: „wysyłka po odpowiedzi (PHP-FPM)” i „cURL” mają znaczenie tylko dla GA4.

**Gdy coś nie działa (w trakcie kampanii)**
- `/bilety` działa źle: usuń na serwerze `bilety.php` (nie zmieniaj nazwy na np. `.off`, bo wtedy kod byłby widoczny). `.htaccess` sam przekierowuje do eBilet z parametrami z linku, tylko bez statystyk.
- Cała strona pokazuje błąd: wgraj z powrotem kopię `.htaccess` z punktu 1 (zmień nazwę na `.htaccess`).
- Panel zablokowany po nieudanych próbach: odczekaj 15 minut albo usuń przez FTP plik `_bilety/dane/logowania.php`.
- Zapomniane hasło: usuń przez FTP `_bilety/dane/ustawienia.php` (wraca hasło przekazane przy wdrożeniu; usuwa też zapisany klucz GA4).
- Nigdy nie usuwaj całego folderu `_bilety/dane` (wejścia i ustawienia).
- Po kampanii (np. do 31.05.2027): pobierz CSV i usuń tylko pliki `_bilety/dane/wejscia-*.php`.

## 4. Po starcie (SEO)

1. **Google Search Console**: dodaj usługę „Domena” `padreguilherme.pl` i zweryfikuj ją rekordem TXT w DNS home.pl (albo wpisz kod w `config.js` → `googleSiteVerification`). Potem: Mapy witryny → `https://padreguilherme.pl/sitemap.xml` → „Sprawdź URL” → „Poproś o zindeksowanie”. W „Sprawdź URL” → „Wyświetl sprawdzoną stronę” → „Zrzut ekranu” cała treść powinna być widoczna.
2. **Bing Webmaster Tools**: import z Search Console (Bing zasila też ChatGPT i Copilota).
3. **IndexNow** (Bing, Yandex, Seznam): plik klucza `456ef02acca8746a616f682133147f7c.txt` jest w paczce (katalog główny). Po każdym wgraniu nowej wersji wystarczy otworzyć w przeglądarce:
   `https://api.indexnow.org/indexnow?url=https://padreguilherme.pl/&key=456ef02acca8746a616f682133147f7c` (odpowiedź 200 lub 202 = przyjęte).
4. **Test wyników z elementami rozszerzonymi** (search.google.com/test/rich-results): powinien pokazać wydarzenie (MusicEvent). Uwaga: Google nie wyświetla wyników „wydarzeń” w Polsce, a wyniki FAQ wyłączył w 2026 r.; dane zostają, bo pomagają zrozumieć stronę (także Bingowi).
5. **Facebook Sharing Debugger** (developers.facebook.com/tools/debug): wklej adres i kliknij „Scrape again”. Od tego momentu link na Facebooku, Messengerze i Instagramie pokazuje grafikę i opis.
6. **PageSpeed Insights** na żywej domenie: wynik do raportu.
7. **Certyfikat SSL**: łańcuch wymaga poprawki po stronie home.pl (Android 13 i starszy, iOS 15). Wiadomość: docs/AUDYT-2026-10-20.md, punkt 1.

## 5. Meta Pixel

- **Zainstalowany (19.10.2026):** piksel `1732539551141809`, ten sam, który działa po stronie eBilet. Zakupy raportuje eBilet, strona raportuje ruch i kliknięcia.
- Zgodnie z RODO piksel ładuje się dopiero po zgodzie na cookies marketingowe. Przy pierwszej wizycie pokazuje się okno zgody (na komputerze na środku ekranu, na telefonie od dołu), a strona za nim jest przyciemniona do czasu wyboru („Akceptuję” / „Tylko niezbędne” / „Ustawienia”). W stopce jest link „Ustawienia cookies”.
- Wycofanie zgody w „Ustawienia cookies” wyłącza piksel i GA4, usuwa ich ciasteczka (`_fbp`, `_fbc`, `_ga`) i przeładowuje stronę. Zgoda jest ważna 12 miesięcy; zmiana `CONSENT_V` w `main.js` (np. po dodaniu nowego narzędzia) pyta wszystkich ponownie.
- Kod jest wpięty w nasz skrypt (`config.js` → `metaPixelId`), a nie wklejony jako osobny snippet. Pomijamy część `<noscript>` z obrazkiem, bo wysyłałaby PageView bez zgody.
- Zdarzenia: `PageView` (po zgodzie), `ViewContent` (wejście w sekcję biletów), `ClickBuyTicket` (kliknięcie „Kup bilet”, z parametrem `cta_location`: hero, menu, bio, love, bilety, faq, final, sticky). Nie wysyłamy `InitiateCheckout` ani `Purchase`, żeby nie dublować zdarzeń eBilet.
- **Sprawdzenie po starcie:** rozszerzenie Meta Pixel Helper (po kliknięciu „Akceptuję”) albo Menedżer zdarzeń → „Testowanie zdarzeń” → adres strony. Warto też zweryfikować domenę padreguilherme.pl w Meta Business (rekord TXT w DNS albo `facebookDomainVerification` w `config.js`).

## 5a. Google Analytics 4

- Usługa „Padre Guilherme”, identyfikator `G-MQFK04FB3F` (19.10.2026). Ładuje się dopiero po zgodzie na analitykę (Consent Mode v2, domyślnie „denied”).
- Zdarzenia: `page_view` (automatycznie), `view_event` (sekcja biletów), `click_buy_ticket` z `cta_location`, `click_media`, `open_gallery`, `submit_accreditation`.
- Nie wklejamy kodu z panelu Google do `index.html`: tag ładuje nasz skrypt po zgodzie. Dlatego narzędzie „Przetestuj instalację” w Google może nie wykryć tagu; sprawdzaj w raporcie Czas rzeczywisty albo DebugView po kliknięciu „Akceptuję”.
- Zmiana identyfikatora tylko przez nową paczkę (`npm run dist`): `config.js` jest wersjonowany i przeglądarki trzymają go w pamięci.

## 6. Co jest skonfigurowane pod SEO i udostępnianie (bez zmian w wyglądzie)

- Tytuł: „Padre Guilherme w Polsce 2027 | Atlas Arena Łódź | Bilety”.
- Opis: „Padre Guilherme, ksiądz i DJ z Portugalii, wystąpi 14 lutego 2027 w Atlas Arenie w Łodzi. Support: Skytech. Sprawdź informacje i kup bilety.”
- H1 z pełną nazwą wydarzenia (dla wyszukiwarek i czytników ekranu; na stronie nadal widać logo).
- Dane strukturalne: strona, wydarzenie (data, miejsce z adresem, wykonawcy, organizator, link do biletów, „w sprzedaży”), Padre Guilherme (także jako Guilherme Peixoto, z profilami społecznościowymi), Skytech, Live2Listen i 18 pytań FAQ.
- Open Graph i Twitter/X: grafika 1200×630 z datą i miejscem, opisy, teksty alternatywne.
- Mapa witryny ze zdjęciami (Google Grafika), `robots.txt`, adres kanoniczny `https://padreguilherme.pl/`.

## 7. Propozycje: gdzie jeszcze pokazać stronę

**Linki, które realnie podnoszą pozycję w Google**
- Strona wydarzenia Atlas Areny i aktualności Live2Listen → link do padreguilherme.pl.
- Bio i Linktree Padre Guilherme oraz Skytecha, strony Booking Artist Agency i Koolwaters.
- Media, które już pisały (lodz.travel, CGM, netfan, dobre.info.pl, strefamusicart): prośba o dopisanie linku. Przy kolejnych informacjach prasowych link zawsze w pierwszym akapicie.

**Social media**
- Wydarzenie na Facebooku (Live2Listen + współorganizatorzy) z linkiem do strony w opisie i jako „bilety”.
- Instagram: link w bio, naklejka z linkiem w Stories, przypięte posty z „link w bio”. Rolki z fragmentem „Pan jest pasterzem moim” (Padre + Skytech).
- TikTok: link w bio, wideo z wcześniejszych koncertów z odsyłaczem do Łodzi.

**Oznaczanie ruchu (UTM)**, żeby wiedzieć, co sprzedaje. Strona przekazuje te parametry dalej do linku „Kup bilet” (nie zapisuje ich w przeglądarce).

| Kanał | Przykład |
|-------|----------|
| Instagram Stories | `?utm_source=instagram&utm_medium=story&utm_campaign=padre_lodz` |
| Instagram bio | `?utm_source=instagram&utm_medium=bio&utm_campaign=padre_lodz` |
| Facebook post / wydarzenie | `?utm_source=facebook&utm_medium=social&utm_campaign=padre_lodz` |
| TikTok bio | `?utm_source=tiktok&utm_medium=bio&utm_campaign=padre_lodz` |
| Reklamy Meta | `?utm_source=meta&utm_medium=paid&utm_campaign=padre_lodz&utm_content={nazwa_kreacji}` |
| Newsletter / mailing | `?utm_source=newsletter&utm_medium=email&utm_campaign=padre_lodz` |

**Kampanie płatne (opcjonalnie)**: remarketing Meta do osób, które kliknęły „Kup bilet” (po instalacji piksela). Google Ads na frazy „Padre Guilherme bilety”, „Padre Guilherme Łódź”, „ksiądz DJ koncert”.
