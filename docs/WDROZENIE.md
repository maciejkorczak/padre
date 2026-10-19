# Wdrożenie padreguilherme.pl

Stan na 19.10.2026.

## 1. Stan domeny

| Co | Stan |
|----|------|
| Domena padreguilherme.pl | Aktywna w home.pl (ważna do 4.09.2027), serwery nazw dns.home.pl. |
| Rekord A (adres strony) | **Brak.** Domena nie jest jeszcze podłączona do żadnego serwera, dlatego strona się nie otwiera. |
| Rekord MX (poczta) | Brak. Strona nie używa adresów @padreguilherme.pl, więc to nie blokuje startu. |
| Wersja testowa | thelastdaynight.thebooking.eu to stary podgląd (bez poprawek z 18–19.10). Na domenę wgrywamy paczkę z punktu 3. |

## 2. Podłączenie domeny w home.pl (DNS)

Domena korzysta z DNS home.pl, więc rekordy ustawią się same po podłączeniu domeny do serwera.

1. Panel home.pl → **Usługi WWW** → wybierz serwer. Najprościej pusty **SERWER2670951** („Domeny: brak”). Może też być SERWER2602341, na którym jest wersja testowa.
2. **Opcje** → podłącz / dodaj domenę → wpisz `padreguilherme.pl`. Dodaj też `www.padreguilherme.pl`.
3. Jako katalog wskaż nowy folder, np. `/padreguilherme.pl`.
4. Włącz bezpłatny **certyfikat SSL** dla `padreguilherme.pl` i `www.padreguilherme.pl`. Bez niego nie zadziała HTTPS.
5. Czas propagacji: zwykle kilkanaście minut, najwyżej ok. godziny (wcześniej nie było rekordu A, więc nic nie trzeba „przeczekiwać” w cache). U części dostawców internetu może to potrwać do 24 h.

Po podłączeniu daj znać. Sprawdzę z zewnątrz DNS, HTTPS, przekierowania i nagłówki, a potem puszczę testy na żywej stronie.

## 3. Wgranie plików

1. Rozpakuj `padreguilherme.pl.zip` (tworzy go `npm run dist`; 201 plików, ok. 12 MB).
2. Przez FTP/FTPS wgraj **zawartość** paczki do katalogu domeny z punktu 2 (tak, żeby `index.html` był bezpośrednio w katalogu).
3. Wgraj też plik ukryty **`.htaccess`**. Część programów FTP domyślnie go nie pokazuje.

`.htaccess` (sprawdzony na Apache 2.4):
- przekierowuje `http://` i `www.` na `https://padreguilherme.pl/` (301, jeden adres dla Google),
- przekierowuje `/index.html` na `/`,
- ustawia typy plików AVIF i WOFF2 (wersja testowa na home.pl wysyłała AVIF bez typu),
- kompresuje pliki tekstowe i ustawia długi cache dla zdjęć, CSS i JS (pliki są wersjonowane),
- blokuje listowanie katalogów i dostęp do plików ukrytych.

Przekierowania działają tylko dla padreguilherme.pl, więc ta sama paczka może leżeć na adresie testowym.
Jeśli po wgraniu strona zapętla się na przekierowaniu, usuń z `.htaccess` blok z `X-Forwarded-Proto` i włącz w panelu home.pl opcję wymuszania HTTPS.

## 4. Po starcie (SEO)

1. **Google Search Console**: dodaj usługę „Domena” `padreguilherme.pl` i zweryfikuj ją rekordem TXT w DNS home.pl (albo wpisz kod w `config.js` → `googleSiteVerification`). Potem: Mapy witryny → `https://padreguilherme.pl/sitemap.xml` → „Sprawdź URL” → „Poproś o zindeksowanie”.
2. **Bing Webmaster Tools**: import z Search Console (Bing zasila też ChatGPT i Copilota).
3. **Test wyników z elementami rozszerzonymi** (search.google.com/test/rich-results): powinien pokazać wydarzenie (MusicEvent) i FAQ.
4. **Facebook Sharing Debugger** (developers.facebook.com/tools/debug): wklej adres i kliknij „Scrape again”. Od tego momentu link na Facebooku, Messengerze i Instagramie pokazuje grafikę i opis.
5. **PageSpeed Insights** na żywej domenie: wynik do raportu.

## 5. Meta Pixel

- **Zainstalowany (19.10.2026):** piksel `1732539551141809`, ten sam, który działa po stronie eBilet. Zakupy raportuje eBilet, strona raportuje ruch i kliknięcia.
- Zgodnie z RODO piksel ładuje się dopiero po zgodzie na cookies marketingowe. Przy pierwszej wizycie widać kompaktowy baner („Akceptuję” / „Tylko niezbędne” / „Ustawienia”), a w stopce link „Ustawienia cookies”.
- Kod jest wpięty w nasz skrypt (`config.js` → `metaPixelId`), a nie wklejony jako osobny snippet. Pomijamy część `<noscript>` z obrazkiem, bo wysyłałaby PageView bez zgody.
- Zdarzenia: `PageView` (po zgodzie), `ViewContent` (wejście w sekcję biletów), `ClickBuyTicket` (kliknięcie „Kup bilet”, z parametrem `cta_location`: hero, menu, bio, love, bilety, faq, final, sticky). Nie wysyłamy `InitiateCheckout` ani `Purchase`, żeby nie dublować zdarzeń eBilet.
- **Sprawdzenie po starcie:** rozszerzenie Meta Pixel Helper (po kliknięciu „Akceptuję”) albo Menedżer zdarzeń → „Testowanie zdarzeń” → adres strony. Warto też zweryfikować domenę padreguilherme.pl w Meta Business (rekord TXT w DNS albo `facebookDomainVerification` w `config.js`).

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

**Oznaczanie ruchu (UTM)**, żeby wiedzieć, co sprzedaje. Strona zapamiętuje te parametry i przekazuje je dalej do linku „Kup bilet”.

| Kanał | Przykład |
|-------|----------|
| Instagram Stories | `?utm_source=instagram&utm_medium=story&utm_campaign=padre_lodz` |
| Instagram bio | `?utm_source=instagram&utm_medium=bio&utm_campaign=padre_lodz` |
| Facebook post / wydarzenie | `?utm_source=facebook&utm_medium=social&utm_campaign=padre_lodz` |
| TikTok bio | `?utm_source=tiktok&utm_medium=bio&utm_campaign=padre_lodz` |
| Reklamy Meta | `?utm_source=meta&utm_medium=paid&utm_campaign=padre_lodz&utm_content={nazwa_kreacji}` |
| Newsletter / mailing | `?utm_source=newsletter&utm_medium=email&utm_campaign=padre_lodz` |

**Kampanie płatne (opcjonalnie)**: remarketing Meta do osób, które kliknęły „Kup bilet” (po instalacji piksela). Google Ads na frazy „Padre Guilherme bilety”, „Padre Guilherme Łódź”, „ksiądz DJ koncert”.
