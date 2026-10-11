# Do potwierdzenia przed publikacją

Stan na 11.10.2026. Wszystkie punkty mają w kodzie bezpieczny punkt podłączenia: brakujące elementy są ukryte albo pokazują uczciwy komunikat. Na produkcji nie ma zmyślonych danych.

Legenda: **BLOKER**: bez tego strona nie powinna wyjść na produkcję. **WAŻNE**: do uzupełnienia przed startem kampanii. **OPCJA**: poprawi stronę, ale nie blokuje.

## Integracje i linki

| # | Co | Status | Gdzie podłączyć | Kto dostarcza |
|---|----|--------|-----------------|---------------|
| 1 | **Link do wydarzenia w eBilet** (konkretne wydarzenie, nie strona główna) | **BLOKER**: brak. Nie znaleźliśmy wydarzenia w eBilet; sprzedaż prawdopodobnie jeszcze nie ruszyła. Do tego czasu wszystkie przyciski „Kup bilet” prowadzą do sekcji #bilety z komunikatem. | `assets/js/config.js` → `ticketUrl`, potem `npm run html` | Live2Listen / eBilet |
| 2 | **Domena padreguilherme.pl** | **BLOKER**: domena jest zarejestrowana (DNS home.pl), ale nie ma rekordu A (brak hostingu) ani **rekordu MX**. Canonical, Open Graph, sitemap i robots wskazują na `https://padreguilherme.pl/`. | `src/index.html` (canonical, og:url, og:image), `scripts/build-html.mjs` (`SITE_URL`), `robots.txt`, `sitemap.xml` | Booking Artist Agency |
| 3 | **Skrzynki info@padreguilherme.pl i media@padreguilherme.pl** | **BLOKER**: bez rekordu MX poczta na te adresy nie zostanie dostarczona. Trzeba skonfigurować skrzynki albo podać inne adresy. | Treść strony (`src/index.html`, `src/content.mjs`) | Booking Artist Agency |
| 4 | **Akredytacje: pressaccreditations.com/pl/live2listen/padreguilherme** | **WAŻNE**: 11.10.2026 adres zwracał błąd certyfikatu TLS i HTTP 404. Przycisk „Złóż wniosek o akredytację” jest ukryty, zamiast niego widać komunikat z adresem media@. | `config.js` → `accreditationUrl`, `accreditationReady: true` | Live2Listen |
| 5 | **Press pack** | **WAŻNE**: brak zatwierdzonego pliku. Przycisk „Pobierz press pack” pojawi się sam po wpisaniu adresu. | `config.js` → `pressPackUrl` | Management / Booking Artist Agency |
| 6 | **Newsletter „Bądź na bieżąco”** | **OPCJA**: formularz jest gotowy (walidacja, zgoda, honeypot, obsługa błędów), ale wyłączony. Brakuje backendu, administratora danych i polityki prywatności dla zapisu. Poprzednia wersja pokazywała fałszywe „Zapisane”; usunięte. | `config.js` → `newsletterEndpoint`, `newsletterPrivacyUrl` | Organizator (administrator danych) |
| 7 | **Analityka: GTM albo GA4, Meta Pixel** | **WAŻNE** przed kampanią: brak identyfikatorów. Kod zgody (Consent Mode v2) i zdarzenia są gotowe; baner zgody pojawi się sam po wpisaniu ID. | `config.js` → `gtmId` **albo** `ga4Id`, `metaPixelId` | Zespół marketingu |
| 8 | **Polityka prywatności dla tej domeny** | **WAŻNE**: stopka linkuje do polityki Live2Listen (strona działa). Trzeba ustalić, kto jest administratorem danych na padreguilherme.pl (analityka, newsletter) i czy ta polityka to obejmuje. | `config.js` → `privacyPolicyUrl` | Prawnik / organizator |

## Treści i fakty

| # | Co | Status |
|---|----|--------|
| 9 | **Plakat z hasłem „Pierwsze headline show”** | Nie jest wyświetlany. Hasło jest sprzeczne z faktami: artysta grał już w Polsce (Chorzów 12.06.2026, Gdańsk 15.08.2026, Opole 4.09.2026). Potrzebna nowa wersja plakatu bez tego hasła albo pisemne potwierdzenie, że chodzi np. o „pierwszy samodzielny koncert halowy”. |
| 10 | **Harmonogram 18:00 / 19:00 / 20:00 / 21:00** | Pokazany na stronie (przekazany przez zespół). Do potwierdzenia przez organizatora. Odliczanie liczy czas do 18:00. |
| 11 | **Kim jest support o 19:00** | Na stronie widnieje samo „Support”. |
| 12 | **Kategorie i ceny biletów (płyta, trybuny, VIP)** | Niepotwierdzone, więc ukryte na produkcji. Pytania FAQ „Czy dostępne są miejsca siedzące?” i „Czy można kupić bilety VIP?” pojawią się dopiero z potwierdzoną odpowiedzią. |
| 13 | **Spółka organizatora** | Regulamin mówi, że organizatorem może być L2L sp. z o.o. albo 828 Studio sp. z o.o. W stopce wpisano L2L sp. z o.o. (ul. Opoczyńska 12/6, Warszawa, KRS 0001121413). |
| 14 | **Role partnerów w stopce** | Zostawiono układ zatwierdzony wcześniej: Organizator: Live2Listen · Bilety: eBilet · Partnerzy: Atlas Arena, Koolwaters, Booking Artist Agency. Do potwierdzenia: czy Atlas Arenę opisać jako obiekt, a Booking Artist Agency jako booking. |
| 15 | **Ogólny kontakt do organizatora** | FAQ podaje hello@live2listen.com (adres z regulaminu, rozdział o szatni) i lost@live2listen.com (z FAQ Live2Listen). |
| 16 | **Dojazd i parkingi** | Strona odsyła do atlasarena.pl. Jeśli organizator ma własne wskazówki (parking, komunikacja, wejścia), warto je dodać. |
| 17 | **Dostępność dla osób z niepełnosprawnościami** | Odpowiedź oparta na FAQ Live2Listen. Brakuje kontaktu w sprawie dostępności i informacji Atlas Areny. |
| 18 | **Sekcja „Polska już go zna. Teraz czas na Łódź.”** | Gotowy komponent, domyślnie **wyłączony** (`sections.poland: false`). Powody: (1) brak zatwierdzonych zdjęć z polskich koncertów (brief: nie publikować niekompletnej sekcji); (2) wcześniejsza decyzja: „Nie piszemy o innych miastach w Polsce, skupiamy się na Łodzi”. Potrzebna decyzja managementu i zdjęcia z Chorzowa, Gdańska i Opola (z prawami do publikacji). |
| 19 | **Podpisy zdjęć w galerii** | Podpisy opisują kadr, bez nazw wydarzeń. Do uzupełnienia: miejsce, data i autor (fotograf) każdego zdjęcia oraz potwierdzenie praw do publikacji. |
| 20 | **Liczby wyświetleń na TikToku** | Pobrane 11.10.2026 z oficjalnego profilu @padreguilherme. Przed startem warto je odświeżyć (zmieniają się codziennie). Strona nie sumuje wyświetleń. |
| 21 | **DJ Mag #79** | Potwierdzone na djmag.com (profil artysty w Top 100 DJs 2026). Opis zaznacza, że ranking powstaje z głosowania fanów. |
| 22 | **„Około 1,5 mln” na ŚDM w Lizbonie** | Szacunek podawany w mediach dla porannego setu 6.08.2023. |
| 23 | **Skytech: linki do muzyki** | Strona skytechmusic.com działa, ale blokuje automatyczne sprawdzenie (CAPTCHA). Jeśli Skytech ma oficjalny Spotify lub YouTube, możemy je dodać. |

## Przed wdrożeniem (technika)

- Hosting z kompresją gzip lub brotli i długim cache dla `assets/` (przykład w README). Bez kompresji LCP na telefonie wynosi 2,9 s zamiast 2,1 s.
- Po wpisaniu `ticketUrl` i domeny: `npm run html`, `npm test`, Lighthouse.
- Testy w Safari (iOS/macOS) i Firefoxie: w tym środowisku był dostępny tylko Chromium.
