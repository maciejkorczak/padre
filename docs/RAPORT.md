# Raport: audyt i wdrożenie landing page Padre Guilherme

Atlas Arena, Łódź, 14.02.2027. Stan na 11.10.2026.

- Podgląd do akceptacji (z notatkami „Do potwierdzenia”): https://claude.ai/artifact/MaMj6ZkCbBELkMe9iNnrDC
- Kopia bezpieczeństwa poprzedniej wersji: `design/canvas-v1/` (osobny commit przed zmianami).
- Nic nie zostało opublikowane na produkcji.

## Status: **BLOCKED** (do publikacji), **NEEDS APPROVAL** (treści)

Kod jest gotowy i przetestowany, ale strona nie może jeszcze wyjść na produkcję:

1. **Brak linku do wydarzenia w eBilet.** Przyciski „Kup bilet” prowadzą na razie do sekcji biletów z komunikatem. Wpisanie linku w `config.js` przełącza wszystkie przyciski naraz.
2. **Domena padreguilherme.pl nie ma hostingu (brak rekordu A) ani poczty (brak rekordu MX).** Adresy info@ i media@ podane na stronie nie odbiorą wiadomości, dopóki skrzynki nie zostaną skonfigurowane.
3. Treści wymagające decyzji managementu: plakat z hasłem „Pierwsze headline show”, sekcja „Polska już go zna”, harmonogram, kategorie biletów.

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
6. „Polska już go zna. Teraz czas na Łódź.”: gotowy komponent, **wyłączony** (patrz G).
7. Galeria edytorska: asymetryczny układ (duże, dwa mniejsze, szerokie, trzy), lightbox.
8. Wybrane wydarzenia: 10 plakatów z linkami do stron wydarzeń, przewijana szyna.
9. Love is My Religion: pełnoekranowe zdjęcie z paralaksą i przyciskiem „Kup bilet”.
10. Skytech jako Official support: zdjęcie, opis, skytechmusic.com, miniatura wideo YouTube (link, bez osadzania).
11. Plan wieczoru.
12. Informacje i bilety: karta biletowa (na telefonie przed listą informacji), dane praktyczne, regulamin, oświadczenie opiekuna.
13. FAQ: 12 pytań w kolejności z briefu i „Pozostałe pytania” z FAQ organizatora.
14. Media i akredytacje oraz kontakt w sprawie partnerstwa.
15. Końcowe CTA i stopka (role podmiotów, dane organizatora, linki prawne, kanały oficjalne).

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
- Tryb podglądu: notatki „Do potwierdzenia” i niepotwierdzone elementy widać tylko w wersji do akceptacji. Build produkcyjny je usuwa.
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
| eBilet (link do wydarzenia) | ❌ niegotowe | brak adresu, punkt podłączenia: `ticketUrl` |
| Press Accreditations | ❌ niegotowe | adres zwracał błąd TLS i 404; przycisk ukryty; `accreditationReady` |
| Press pack | ❌ brak pliku | przycisk pojawi się z `pressPackUrl` |
| Newsletter | ❌ brak backendu | formularz gotowy i przetestowany na symulowanym serwerze (sukces tylko przy 2xx) |
| GA4 / GTM / Meta Pixel | ⏸ gotowe do podłączenia | brak ID; Consent Mode v2, ładowanie po zgodzie, zdarzenia: [ANALITYKA.md](ANALITYKA.md) |
| UTM | ✅ działa | zapamiętywane na czas wizyty, dołączane do zdarzeń i linku eBilet |
| Linki zewnętrzne (31) | ✅ działają | 28 × HTTP 200; Instagram 429 i RA 403 to blokady botów (w przeglądarce działają); padreguilherme.pl: brak rekordu A |
| PDF: regulamin, oświadczenie opiekuna | ✅ | lokalne pliki |

## G. Brakujące materiały

1. Link do wydarzenia w eBilet.
2. Hosting i poczta dla padreguilherme.pl (rekordy A i MX) albo inna domena i adresy kontaktowe.
3. Działający adres formularza akredytacyjnego.
4. Zatwierdzony press pack.
5. Potwierdzone kategorie i ceny biletów, informacja o miejscach siedzących i VIP.
6. Potwierdzenie harmonogramu i nazwa supportu o 19:00.
7. **Zdjęcia z polskich koncertów** (Chorzów, ING Silesia Beats, 12.06.2026; Gdańsk, ERGO Arena, 15.08.2026; Opole, Itaka Arena, 4.09.2026) z prawami do publikacji oraz decyzja managementu, czy publikować sekcję „Polska już go zna”. Uwaga: wcześniej padła instrukcja „Nie piszemy o innych miastach w Polsce”, a brief prosi o tę sekcję. Komponent jest gotowy i włącza się jednym ustawieniem.
8. Nowa wersja plakatu bez hasła „Pierwsze headline show” (obecny plakat nie jest używany).
9. Miejsca, daty i autorzy zdjęć w galerii.
10. Identyfikatory GTM/GA4/Meta i polityka prywatności dla tej domeny (administrator danych).
11. Oficjalne linki do muzyki Skytecha (Spotify, YouTube), jeśli mają być na stronie.
12. Wskazówki dojazdu i parkingu, kontakt w sprawie dostępności.

## H. Testy

**Automatyczne: `npm test` — 94/94 zaliczone** (Playwright, Chromium 141):
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
- **Podgląd z notatkami:** `podglad-desktop-notatki`, `podglad-desktop-bilety-notatki`, `podglad-desktop-polska`.

## J. Status

**BLOCKED** do publikacji: brak linku eBilet oraz brak hostingu i poczty dla padreguilherme.pl.
**NEEDS APPROVAL:** treści i decyzje z sekcji G (plakat, sekcja „Polska”, harmonogram, kategorie biletów, role partnerów).

Po dostarczeniu punktów 1–2 z sekcji G i akceptacji treści: `npm run html`, `npm test`, Lighthouse na docelowym serwerze. Wtedy strona może dostać status READY.
