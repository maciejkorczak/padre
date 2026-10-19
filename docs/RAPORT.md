# Raport: audyt i wdrożenie landing page Padre Guilherme

Atlas Arena, Łódź, 14.02.2027. Stan na 18.10.2026 (po poprawkach Marka).

- Podgląd strony: https://claude.ai/artifact/MaMj6ZkCbBELkMe9iNnrDC
- Kopia bezpieczeństwa poprzedniej wersji: `design/canvas-v1/` (osobny commit przed zmianami).
- Nic nie zostało opublikowane na produkcji.

## Status: **NEEDS APPROVAL**

Po poprawkach z 18.10 przyciski „Kup bilet” prowadzą bezpośrednio do wydarzenia w eBilet, a strona nie używa już adresów @padreguilherme.pl. Przed publikacją pod docelową domeną zostają:

1. **Domena padreguilherme.pl nie ma rekordu A.** Canonical, Open Graph i sitemap wskazują na tę domenę. Jeśli strona ma działać pod innym adresem, trzeba go wpisać w tych miejscach.
2. **Formularz akredytacyjny** (adres potwierdzony) 11 i 18.10 nie działał: certyfikat TLS nie pasuje do domeny, HTTP 404. Przycisk jest włączony.
3. Treści czekające na decyzję: plakat, support (sekcja ukryta), harmonogram (sekcja ukryta), kategorie biletów.

Pełna lista: [DO-POTWIERDZENIA.md](DO-POTWIERDZENIA.md).

---

## A. Co zmieniono

Poprzednia wersja (kanwa projektowa) została przeniesiona do samodzielnej, statycznej strony (`index.html` + `assets/`), z zachowaniem charakteru: ciemna paleta, te same zdjęcia, logo, kolor akcentu #E8834E i kroje Manrope, Saira i Pinyon Script.

**Struktura strony (nowa kolejność):**
1. Hero: logo (H1), „Love is My Religion”, 14.02.2027, Atlas Arena | Łódź, „Kup bilet”, „Muzyka, która łączy pokolenia.”
2. Pasek najważniejszych informacji: kiedy, gdzie, otwarcie bram, support, bilety, odliczanie do otwarcia bram.
3. TikTok: sześć najczęściej oglądanych nagrań (miniatura, miejsce, liczba wyświetleń, ikona odtwarzania, link do oryginału).
4. DJ Mag Top 100 DJs 2026: duże „#79”, „New entry”, zdanie z briefu, informacja, że ranking powstaje z głosowania fanów.
5. Biografia: widoczny tekst skrócony z 219 do 88 słów; dalsza część historii (ŚDM, festiwale, DJ Mag) pod przyciskiem „Poznaj historię Padre”; na końcu „Kup bilet”.
6. Galeria edytorska: asymetryczny układ (duże, dwa mniejsze, szerokie, trzy), lightbox.
7. Wybrane wydarzenia: 10 plakatów z linkami do stron wydarzeń, przewijana szyna.
8. Love is My Religion: pełnoekranowe zdjęcie z paralaksą i przyciskiem „Kup bilet”.
9. Skytech jako Official support: zdjęcie, opis, skytechmusic.com, miniatura wideo YouTube (link, bez osadzania).
10. Plan wieczoru.
11. Informacje i bilety: karta biletowa (na telefonie przed listą informacji), dane praktyczne, regulamin, oświadczenie opiekuna.
12. FAQ: 10 pytań w kolejności z briefu (pytania o miejsca siedzące i VIP dojdą po potwierdzeniu odpowiedzi) i „Pozostałe pytania” z FAQ organizatora.
13. Media i akredytacje (przycisk „Złóż wniosek o akredytację”) oraz kontakt w sprawie partnerstwa.
14. Końcowe CTA i stopka (role podmiotów, dane organizatora, linki prawne, kanały oficjalne).

**Usunięte lub zablokowane, bo były niezgodne z briefem:**
- „Pierwsze headline show Padre Guilherme w Polsce!” (hero, sekcja show, karta partnerstwa) i plakat z tym hasłem.
- „Bilety ograniczone!” (sztuczne FOMO).
- Linki „Kup bilet” do strony głównej ebilet.pl.
- Formularz przedsprzedaży, który pokazywał „Zapisane. Link wyślemy na…” bez żadnego backendu. Zastąpiony formularzem „Bądź na bieżąco”, który włącza się dopiero z prawdziwym endpointem.
- Kafle z kategoriami „Płyta / Trybuny / VIP — Cena wkrótce” (niepotwierdzone).
- Stałe „pływanie” wszystkich 10 plakatów naraz (brief: bez ciężkich animacji na wszystkich zdjęciach jednocześnie). Zamiast tego powiększenie przy najechaniu i przewijana szyna.
- Niezweryfikowane fakty z biografii: „jedyny Portugalczyk na liście”, lista wyprzedzonych artystów, „ok. 150 tys. osób na Medusa”, występy pod Cristo Redentor i przy Torre dos Clérigos.

**Technika:**
- Zdjęcia: AVIF + JPEG w 2–4 szerokościach (`srcset`/`sizes`), osobny pionowy kadr hero na telefon, `width`/`height` przy każdym obrazie (brak przesunięć układu), lazy loading poza pierwszym ekranem, preload zdjęcia hero.
- Fonty self-hosted (woff2, latin + latin-ext), `font-display: swap`, preload dwóch najważniejszych.
- Jeden plik CSS (48 KB) i jeden JS (27 KB), bez bibliotek; JS ładowany z `defer`. Wersjonowanie plików (`?v=`) dla bezpiecznego cache.
- SEO: title i description z briefu, canonical, Open Graph i Twitter Card z nową grafiką 1200×630, `robots.txt`, `sitemap.xml`, dane strukturalne MusicEvent (data, miejsce z adresem, wykonawcy, organizator; bez cen i dostępności, oferta dopiero z linkiem eBilet), jeden H1, poprawna hierarchia nagłówków.
- Dostępność: link „Przejdź do treści”, widoczny fokus, menu i lightbox z pułapką fokusu i obsługą ESC, akordeon z `aria-expanded`/`aria-controls`, teksty alternatywne, kontrast AA, cele dotykowe ≥ 44 px dla przycisków, `prefers-reduced-motion`.
- Konfiguracja wszystkich integracji w jednym pliku (`assets/js/config.js`).
- Testy automatyczne (`npm test`) i generator zrzutów ekranu.

## B. Copywriting: najważniejsze poprawki

| Było | Jest |
|------|------|
| Pierwsze headline show Padre Guilherme w Polsce! | (usunięte) Hero: Padre Guilherme / Love is My Religion / 14.02.2027 / Atlas Arena \| Łódź |
| Fenomenalne show, przygotowywane od paru miesięcy, ujrzy światło dzienne w Łodzi… | 14 lutego 2027 roku wystąpi w Atlas Arenie w Łodzi. |
| Bilety ograniczone! | Bilety dostępne na eBilet. |
| Padre Guilherme szturmem stał się artystą, który łączy ludzi! | Od portugalskiej parafii po największe sceny świata (H2) + „Padre Guilherme. Artysta, który łączy ludzi.” |
| Pierwszy polski koncert, na którym Padre Guilherme jest headlinerem. | (usunięte) |
| Kup bilet na eBilet.pl / Kup bilet / Szczegóły | Wszędzie jedna nazwa: „Kup bilet” |
| Najpopularniejsze na TikToku | Nagrania, które obejrzały miliony (+ przypis: wyświetlenia każdego nagrania osobno, stan na 11.10.2026) |
| Wybrane sceny | Kluby i festiwale, na których grał |
| Przedsprzedaż: zapisz się jako pierwszy | Bądź na bieżąco (tylko z działającym backendem) |
| Atlas Arena, Walentynki i publiczność z całej Polski. Porozmawiajmy o współpracy przy pierwszym headline show… | Chcesz, żeby Twoja marka była obecna przy koncercie Padre Guilherme w Atlas Arenie? Napisz do nas. |
| Do Łodzi wygodnie dojedziesz pociągiem (dworzec Łódź Fabryczna)… | Organizator zachęca do komunikacji miejskiej lub taxi. Dojazd i parkingi: atlasarena.pl (bez wymyślonych szczegółów) |
| FAQ: długie, kancelaryjne odpowiedzi skopiowane z FAQ organizatora | Krótsze, konkretne odpowiedzi o tej samej treści prawnej, oparte na regulaminie |

Zasady: bez „wyjątkowy / niesamowity / fenomenalny” w każdej sekcji, bez wykrzykników w treści, bez religijnych prowokacji i bez sugestii, że koncert ma charakter liturgiczny. DJ Mag opisany jako głosowanie fanów, nie obiektywny ranking. Nazwy własne bez zmian (Love is My Religion, Official support, New entry, Arena show: hasła z materiałów).

## C. Animacje

Jeden system ruchu, tylko `transform` i `opacity`, wszystko wyłączone przy `prefers-reduced-motion`:

- **Hero:** powolny zoom zdjęcia 1,00 → 1,06 przez 16 s; sekwencja wejścia logo → hasło → data → miejsce → przycisk (ok. 1,4 s, kliknięcia nie są blokowane); paralaksa tła tylko na komputerach; subtelny wskaźnik przewijania.
- **Nagłówki i bloki:** fade + translateY przy przewijaniu (IntersectionObserver), z niewielkim opóźnieniem kolejnych elementów. Bez JavaScriptu treść jest od razu widoczna.
- **Galeria:** odsłanianie przy przewijaniu, delikatna paralaksa zdjęć w ramkach (komputer), powiększenie przy najechaniu, lightbox z przejściem, klawiaturą i gestem przesunięcia.
- **TikTok i plakaty:** płynnie przewijane szyny (scroll-snap, przyciski), powiększenie miniatur przy najechaniu, liczniki wyświetleń dochodzą do prawdziwej wartości od 82% (nie od zera, bez zawyżania).
- **DJ Mag:** duża liczba z gradientem i miękką poświatą, pojawia się ze skalowaniem 0,96 → 1.
- **Love is My Religion:** paralaksa zdjęcia (komputer).
- **FAQ i biografia:** płynne rozwijanie.
- **Przyciski i karty:** subtelne uniesienie i cień.

## D. Mobile

- Osobny pionowy kadr zdjęcia hero: napisy nad i pod artystą, twarz nie jest zasłonięta.
- Pełnoekranowe menu z dużymi linkami i kanałami społecznościowymi (zamykanie: ESC, link, przycisk).
- Przyklejony przycisk „Kup bilet” na dole ekranu (z `safe-area`): pojawia się po przewinięciu hero, chowa się przy końcowym CTA, stopce, otwartym menu, lightboxie i podczas wpisywania w formularz.
- Szyny TikTok i plakatów przewijane palcem, lightbox z gestem przesunięcia.
- Karta biletowa przed listą informacji. Galeria w układzie 2-kolumnowym z szerokimi kadrami.
- Przetestowane szerokości: 360, 390, 768, 1440 px. Brak poziomego przewijania.
- Na telefon pobierają się mniejsze pliki (np. hero 26 KB w AVIF zamiast pełnego zdjęcia 2400 px).

## E. Sprzedaż (CTA i ścieżka zakupu)

- „Kup bilet” w 8 miejscach: menu, hero, po biografii, Love is My Religion, karta biletowa, FAQ („Gdzie kupić bilety?”), końcowe CTA, przyklejony przycisk na telefonie. Do tego link „eBilet” w stopce (ten sam adres).
- Jeden link dla wszystkich przycisków (`ticketUrl`), otwierany w nowej karcie, z dopisanymi parametrami UTM kampanii. Brak linku = przyciski prowadzą do sekcji biletów z uczciwym komunikatem (bez strony głównej eBilet i bez martwych przycisków).
- Na pierwszym ekranie: kto, kiedy, gdzie i przycisk. Pod hero pasek najważniejszych informacji.
- Bez sztucznego FOMO, bez niepotwierdzonych cen i kategorii. Informacja o oficjalnej odsprzedaży w eBilet i o ryzyku biletów z innych źródeł (z regulaminu i FAQ organizatora).
- Pomiar kliknięć według lokalizacji przycisku. Kliknięcie nie jest raportowane jako zakup.

## F. Integracje

| Integracja | Stan | Uwagi |
|------------|------|-------|
| eBilet (link do wydarzenia) | ✅ działa | https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme, wszystkie przyciski „Kup bilet” (+ UTM) |
| Press Accreditations | ⚠️ przycisk włączony | adres potwierdzony (www.pressaccreditations.com/pl/live2listen/padreguilherme); 11.10.2026 strona zwracała błąd certyfikatu TLS i HTTP 404, musi działać przed publikacją |
| Press pack | ❌ brak pliku | przycisk pojawi się z `pressPackUrl` |
| Newsletter | ❌ brak backendu | formularz gotowy i przetestowany na symulowanym serwerze (sukces tylko przy 2xx) |
| GA4 / GTM / Meta Pixel | ⏸ gotowe do podłączenia | brak ID; Consent Mode v2, ładowanie po zgodzie, zdarzenia: [ANALITYKA.md](ANALITYKA.md) |
| UTM | ✅ działa | zapamiętywane na czas wizyty, dołączane do zdarzeń i linku eBilet |
| Linki zewnętrzne (31) | ✅ działają | 28 × HTTP 200; Instagram 429 i RA 403 to blokady botów (w przeglądarce działają); padreguilherme.pl: brak rekordu A |
| PDF: regulamin, oświadczenie opiekuna | ✅ | lokalne pliki |

## G. Brakujące materiały

1. Hosting dla padreguilherme.pl (rekord A) albo docelowy adres strony.
2. Uruchomiona strona formularza akredytacyjnego pod potwierdzonym adresem (dziś: błąd certyfikatu i 404).
3. Zatwierdzony press pack.
4. Potwierdzone kategorie i ceny biletów, informacja o miejscach siedzących i VIP.
5. Ogłoszenie supportu i publikacja harmonogramu (sekcje ukryte do tego czasu).
6. Nowa wersja plakatu bez hasła „Pierwsze headline show” (obecny plakat nie jest używany).
7. Miejsca, daty i autorzy zdjęć w galerii.
8. Identyfikatory GTM/GA4/Meta i polityka prywatności dla tej domeny (administrator danych).
9. Oficjalne linki do muzyki Skytecha (Spotify, YouTube), jeśli mają być na stronie.
10. Wskazówki dojazdu i parkingu, kontakt w sprawie dostępności.

## H. Testy

**Automatyczne: `npm test` — 109/109 zaliczone** (Playwright, Chromium 141):
- produkcyjny HTML: brak zakazanych sformułowań, brak notatek podglądu, brak linku do strony głównej eBilet, poprawne title, description, canonical, OG, JSON-LD;
- desktop 1440: jeden H1, hierarchia nagłówków, 8 przycisków „Kup bilet” o jednej nazwie (+ link w stopce), brak poziomego przewijania, brak błędów w konsoli, wszystkie obrazy z `alt`;
- lightbox: otwieranie, fokus, strzałki, zapętlenie, pułapka fokusu, ESC, powrót fokusu; gest przesunięcia na telefonie;
- FAQ (mysz i Enter), rozwijana biografia, przewijanie szyn;
- telefon 390 i 360: menu (otwieranie na pełną wysokość, ESC, linki), przyklejony przycisk (ukryty w hero, widoczny po przewinięciu, schowany przy stopce), cele dotykowe, brak poziomego przewijania;
- tablet 768; tryb ograniczonego ruchu (brak zoomu, paralaksy i ukrytej treści); strona bez JavaScriptu;
- symulacja włączonych integracji: linki eBilet z UTM, baner zgody, brak trackerów przed zgodą i po odmowie, GA4 bez Meta przy zgodzie tylko analitycznej, akredytacje, press pack, newsletter (walidacja, błąd 500, sukces 2xx);
- pomiar: `view_event`, `click_buy_ticket` (z lokalizacją i urządzeniem), `click_media`, `open_gallery`, `submit_accreditation`, `newsletter_signup`, parametry UTM w zdarzeniach;
- kotwice i pliki lokalne; linki zewnętrzne (`--links`).

**Lighthouse 12.2.1** (raporty w `docs/lighthouse/`):

| Pomiar | Wydajność | Dostępność | Dobre praktyki | SEO | FCP | LCP | TBT | CLS |
|--------|-----------|------------|----------------|-----|-----|-----|-----|-----|
| Telefon, serwer z gzip i cache (jak produkcja) | 98 | 100 | 100 | 100 | 1,5 s | **2,1 s** | 0 ms | **0** |
| Komputer, serwer z gzip i cache | 100 | 100 | 100 | 100 | 0,4 s | 0,5 s | 0 ms | 0 |
| Telefon, serwer testowy bez kompresji | 92 | 100 | 100 | 100 | 2,0 s | 3,1 s | 20 ms | 0 |

- **LCP < 2,5 s:** osiągnięte tylko z kompresją po stronie serwera (symulacja Lighthouse, wolne 4G). Bez kompresji: 3,1 s. Na produkcji trzeba włączyć gzip lub brotli (README).
- **CLS < 0,1:** 0 we wszystkich pomiarach.
- **INP < 200 ms:** nie da się zmierzyć w teście laboratoryjnym. Wskaźnik zastępczy TBT wynosi 0–20 ms. Rzeczywisty INP pokażą dane z Chrome UX Report lub GA4 po starcie.

**Czego nie przetestowano:** Safari (iOS i macOS) i Firefox. W środowisku był tylko Chromium. Kod nie korzysta z funkcji specyficznych dla Chrome, ale wymaga ręcznego sprawdzenia na iPhonie przed publikacją.

## I. Zrzuty ekranu

W `docs/screenshots/`:

- **Przed:** `przed-desktop-hero.jpg`, `przed-desktop-calosc.jpg`, `przed-mobile-hero.jpg`, `przed-mobile-calosc.jpg` (statyczny render kanwy v1 z tymi samymi zdjęciami).
- **Po, komputer:** `po-desktop-hero`, `-tiktok`, `-djmag`, `-bio`, `-galeria`, `-lightbox`, `-love`, `-skytech`, `-bilety`, `-faq`, `-media`, `-stopka`.
- **Po, telefon:** `po-mobile-hero`, `-menu`, `-sticky`, `-tiktok`, `-galeria`, `-lightbox`, `-bilety`, `-final`.

## J. Status

**NEEDS APPROVAL**: link eBilet i kontakty są gotowe; zostają domena padreguilherme.pl i działający formularz akredytacyjny.
Treści i decyzje z sekcji G: plakat, support, harmonogram, kategorie biletów, role partnerów.

Po dostarczeniu punktów 1–2 z sekcji G i akceptacji treści: `npm run html`, `npm test`, Lighthouse na docelowym serwerze. Wtedy strona może dostać status READY.

## Zmiany po uwagach zespołu (11.10.2026)

- Sekcja „Polska już go zna. Teraz czas na Łódź.” usunięta w całości (szablon, style, konfiguracja, notatki). Karta TikToka z „Pan jest pasterzem moim” ma podpis „Polska”, bez nazw innych miast.
- Akredytacje: przycisk „Złóż wniosek o akredytację” włączony z adresem www.pressaccreditations.com/pl/live2listen/padreguilherme (wpisany także w HTML, działa bez JavaScriptu).
- Usunięte wszystkie notatki „Do potwierdzenia” ze strony (także z podglądu), lista kategorii biletów „do potwierdzenia” i dwa pytania FAQ bez potwierdzonych odpowiedzi (miejsca siedzące, VIP). Otwarte kwestie są tylko w `docs/DO-POTWIERDZENIA.md`.

## Poprawki Marka (18.10.2026)

Na podstawie PDF z uwagami (wydruk thelastdaynight.thebooking.eu z 12.10.2026):

- **Bilety:** wszystkie przyciski „Kup bilet” prowadzą bezpośrednio do strony wydarzenia w eBilet; w karcie biletowej przycisk zamiast komunikatu; w końcowym CTA „Bilety już w sprzedaży.”
- **Pasek informacji:** usunięte „Bramy 18:00” i „Bilety: eBilet”; odliczanie „Do wydarzenia pozostało” pokazuje tylko dni (pełne dni kalendarzowe, czas polski).
- **Godziny:** usunięte z paska, z informacji i z FAQ; FAQ: „Harmonogram wydarzenia zostanie opublikowany i przesłany do nabywców biletów na kilka dni przed wydarzeniem.”
- **Ukryte do ogłoszenia:** sekcja Skytech (support) i sekcja „Plan wieczoru” wraz z linkiem „Plan” w menu. Włączenie: `supportAnnounced` / `scheduleAnnounced` w `config.js`.
- **Usunięte teksty:** przypis o liczbie wyświetleń TikToka, „Kliknij zdjęcie…” w galerii, zdanie o godzinach na bilecie.
- **Regulamin zamiast PDF:** wszystkie linki (Wstęp, Regulamin, FAQ, stopka) prowadzą do live2listen.com/regulamin. Pliki PDF usunięte z `assets/docs`, link „Oświadczenie opiekuna” usunięty ze stopki.
- **Kontakt:** media → kinga@live2listen.com; partnerstwo, sponsoring i kontakt w stopce → formularz na stronie Live2Listen; usunięte hello@ i lost@.
- **FAQ:** nowa odpowiedź „Gdzie kupić bilety?” (bilety wyłącznie przez linki na tej stronie), „kod kreskowy” zamiast „QR”, poprawiona odpowiedź o szatni, usunięte pytania o odwołanie wydarzenia i zgubione rzeczy.
- **Stopka:** bez kolumny „Bilety”.
- **Wydruk:** style do druku (PDF do recenzji bez nachodzącego nagłówka, bez pomarańczowego koła za „#79”, ze zdjęciem w hero).

## Poprawki z 19.10.2026

- **Bez nazwy sprzedawcy na stronie:** usunięte wszystkie wzmianki o eBilet w treści (karta biletowa: „Bilety już w sprzedaży.”, opis przycisku, odsprzedaż, FAQ, meta description, tekst dla czytników ekranu, dane strukturalne). Przyciski „Kup bilet” nadal prowadzą bezpośrednio do strony wydarzenia.
- **Skytech wrócił** (`supportAnnounced: true`): sekcja Official support, „Support: Skytech” w pasku informacji, Skytech w danych strukturalnych. Nowe zdjęcia: portret na pomarańczowym tle i sylwetka na tle smugi światła. Zdjęcie na białym tle jest w `source/images/skytech-biale-tlo.jpg`, nieużyte (jasne tło odcina się od ciemnej strony).
- Plan wieczoru nadal ukryty (godziny nie są komunikowane).
- Poprawka przewijania na telefonie przy ograniczonym ruchu; komentarze szablonu usuwane z HTML.

## Zmiany z 19.10.2026 (start strony)

- **BIO Skytecha** z oficjalnego bio 2026: „Voodoo” z Martinem Garrixem i R3HAB-em, top 25 producentów 2025, wsparcie m.in. Davida Guetty, Tiësto, Aloka, Anymy i ARTBAT, występy na Tomorrowland i w Ushuaïa Ibiza.
- **SEO bez zmian w wyglądzie:** nowy opis z frazą „ksiądz i DJ”, H1 z nazwą wydarzenia, dane strukturalne @graph (WebSite, WebPage, MusicEvent z ofertą „w sprzedaży”, Person ×2, Organization, FAQPage z 18 pytaniami), mapa witryny ze zdjęciami, dodatkowe tagi Open Graph i Twitter, obsługa meta tagów weryfikacji domeny.
- **Wdrożenie:** `.htaccess` dla Apache/home.pl (HTTPS, bez www, AVIF/WOFF2, kompresja, cache) sprawdzony na lokalnym Apache 2.4; paczka `npm run dist`; instrukcja [WDROZENIE.md](WDROZENIE.md).
- **Meta Pixel:** nie zainstalowany (nie otrzymaliśmy ID), gotowy do włączenia jednym wpisem.
