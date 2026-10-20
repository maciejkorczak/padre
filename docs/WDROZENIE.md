# Wdrożenie padreguilherme.pl

Stan na 19.10.2026, po uruchomieniu strony.

## 1. Stan (19.10.2026, 21:30): strona działa

| Co | Stan |
|----|------|
| Adres | **https://padreguilherme.pl** (www, http i /index.html przekierowują 301 na ten adres) |
| DNS | A `46.242.241.87` (SERWER2670951), `www` → CNAME na domenę główną, TTL 60 s. Potwierdzone w Google DNS i Cloudflare. |
| Certyfikat | homeSSL (home.pl) dla padreguilherme.pl i www, ważny do 22.03.2027, odnawiany w ramach subskrypcji do 5.09.2027. |
| Serwer | SERWER2670951, Ustawienia WWW: „Główny katalog na serwerze”. Strona leży bezpośrednio w `/`. |
| Inne foldery w `/` | `ebiletconfidential` (strona Press Accreditations) i `tmp` (systemowy): nie usuwać. `ebiletconfidential` otwiera się też pod padreguilherme.pl/ebiletconfidential/. |
| WAF | Wyłączony (strona statyczna, bez PHP i bazy). |

## 2. Dostęp FTP

- Serwer `serwer2670951.hosting-home.pl`, port 21 (FTPS), login `padre@padreguilherme.pl` (małymi literami).
- Konto widzi katalog główny `/` serwera, czyli katalog strony.
- Menedżer plików home.pl (WebFTP) pokazuje osobne drzewo z folderem `/padreguilherme` z pierwszej próby („podkatalog z separacją”). Ten folder nie jest używany przez domenę.

## 3. Aktualizacja strony

1. `npm run dist` → `dist/padreguilherme.pl.zip` (240 plików, ok. 18 MB; stan 20.10.2026).
2. Rozpakuj i wgraj **zawartość** do `/` przez FileZillę, z nadpisaniem. Nie ruszaj `ebiletconfidential` ani `tmp`.
3. `.htaccess` jest w paczce (plik ukryty). Na Macu: w Finderze Cmd+Shift+. pokazuje ukryte pliki.

`.htaccess` (sprawdzony na Apache 2.4 i na żywym serwerze):
- **krótki adres dla kampanii** `https://padreguilherme.pl/bilety` (też `/bilety/`, www, http, wielkie litery) przekierowuje (302) od razu do
  `https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme?partner=l2lsp&utm_source=direct#padre-guilherme_155685,1622` (decyzja Marka 20.10.2026).
  Adres bez „/” przed „?”, bo wersja z ukośnikiem przekierowuje w eBilet i gubi `utm_source` (sprawdzone 20.10). Identyfikator kliknięcia reklamy (`fbclid`, `gclid`) przechodzi dalej; inne parametry (np. własne UTM agencji) nie. Wejścia przez `/bilety` nie trafiają do GA4 strony (przekierowanie następuje przed załadowaniem strony); mierzy je piksel i statystyki eBilet,
- przekierowuje `http://` i `www.` na `https://padreguilherme.pl/` (301, parametry UTM zostają),
- przekierowuje `/index.html` na `/`,
- ustawia typy plików AVIF i WOFF2,
- kompresuje pliki tekstowe (gzip),
- długi cache tylko dla `/assets/` (pliki są wersjonowane), strona główna zawsze świeża; inne foldery na serwerze zostają bez zmian,
- blokuje listowanie katalogów i dostęp do plików ukrytych.

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
- Zgodnie z RODO piksel ładuje się dopiero po zgodzie na cookies marketingowe. Przy pierwszej wizycie widać kompaktowy baner („Akceptuję” / „Tylko niezbędne” / „Ustawienia”), a w stopce link „Ustawienia cookies”.
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
