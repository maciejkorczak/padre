# Do potwierdzenia przed publikacją

Stan na 18.10.2026 (po poprawkach Marka). Wszystkie punkty mają w kodzie bezpieczny punkt podłączenia: brakujące elementy są ukryte albo pokazują uczciwy komunikat. Na produkcji nie ma zmyślonych danych.

Legenda: **BLOKER**: bez tego strona nie powinna wyjść na produkcję. **WAŻNE**: do uzupełnienia przed startem kampanii. **OPCJA**: poprawi stronę, ale nie blokuje.

## Integracje i linki

| # | Co | Status | Gdzie podłączyć | Kto dostarcza |
|---|----|--------|-----------------|---------------|
| 1 | **Link do wydarzenia w eBilet** | ✅ **Gotowe**: https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme (sprzedaż od 13.10.2026). Wszystkie przyciski „Kup bilet” prowadzą tam bezpośrednio. Nazwa sprzedawcy nie jest komunikowana w treści strony (decyzja z 19.10). Do decyzji: czy dopisać parametr partnera organizatora (Live2Listen linkuje z `?partner=l2lsp`). | `config.js` → `ticketUrl` | — |
| 2 | **Domena padreguilherme.pl** | ✅ **Strona działa od 19.10.2026** pod https://padreguilherme.pl (DNS, SSL, przekierowania sprawdzone). Szczegóły: docs/WDROZENIE.md. | — | — |
| 3 | **Adresy e-mail na stronie** | ✅ Rozwiązane: strona nie używa już adresów @padreguilherme.pl. Media: kinga@live2listen.com, partnerstwo i kontakt: formularz na stronie Live2Listen (live2listen.com/#kontakt). | — | — |
| 4 | **Akredytacje: www.pressaccreditations.com/pl/live2listen/padreguilherme** | **BLOKER**: adres potwierdzony, przycisk „Złóż wniosek o akredytację” jest włączony. 11 i 18.10.2026 strona nie działała: serwer zwraca certyfikat TLS niepasujący do domeny (przeglądarka pokaże ostrzeżenie) i HTTP 404. Przed publikacją formularz musi być dostępny; w razie opóźnienia ustaw `accreditationReady: false`. | `config.js` → `accreditationUrl`, `accreditationReady` | Live2Listen / Press Accreditations |
| 5 | **Press pack** | **WAŻNE**: brak zatwierdzonego pliku. Przycisk „Pobierz press pack” pojawi się sam po wpisaniu adresu. | `config.js` → `pressPackUrl` | Management / Booking Artist Agency |
| 6 | **Newsletter „Bądź na bieżąco”** | **OPCJA**: formularz jest gotowy (walidacja, zgoda, honeypot, obsługa błędów), ale wyłączony. Brakuje backendu, administratora danych i polityki prywatności dla zapisu. Poprzednia wersja pokazywała fałszywe „Zapisane”; usunięte. | `config.js` → `newsletterEndpoint`, `newsletterPrivacyUrl` | Organizator (administrator danych) |
| 7 | **Analityka: GTM albo GA4, Meta Pixel** | ✅ Meta Pixel 1732539551141809 włączony (po zgodzie). GA4/GTM: **WAŻNE** przed kampanią: brak identyfikatorów. Kod zgody (Consent Mode v2) i zdarzenia są gotowe; baner zgody pojawi się sam po wpisaniu ID. | `config.js` → `gtmId` **albo** `ga4Id`, `metaPixelId` | Zespół marketingu |
| 8 | **Polityka prywatności dla tej domeny** | **WAŻNE**: stopka linkuje do polityki Live2Listen (strona działa). Trzeba ustalić, kto jest administratorem danych na padreguilherme.pl (analityka, newsletter) i czy ta polityka to obejmuje. | `config.js` → `privacyPolicyUrl` | Prawnik / organizator |

## Treści i fakty

| # | Co | Status |
|---|----|--------|
| 9 | **Plakat z hasłem „Pierwsze headline show”** | Nie jest wyświetlany. Uwaga: Atlas Arena i media (np. CGM, netfan) piszą o „pierwszym headline show w Polsce”; jeśli management to potwierdza, hasło może wrócić. Hasło jest sprzeczne z faktami: artysta grał już w Polsce (Chorzów 12.06.2026, Gdańsk 15.08.2026, Opole 4.09.2026). Potrzebna nowa wersja plakatu bez tego hasła albo pisemne potwierdzenie, że chodzi np. o „pierwszy samodzielny koncert halowy”. |
| 10 | **Harmonogram** | Sekcja „Plan wieczoru”, link „Plan” w menu, godziny w pasku informacji i w FAQ są ukryte do czasu publikacji harmonogramu (decyzja z 18.10). FAQ: harmonogram zostanie opublikowany i przesłany kupującym kilka dni przed wydarzeniem. Powrót: `scheduleAnnounced: true` (sprawdzić godziny w `src/index.html`). |
| 11 | **Support** | ✅ Skytech ogłoszony (19.10): sekcja i „Support” w pasku informacji są widoczne. Nowe zdjęcia Skytecha użyte w sekcji. |
| 12 | **Kategorie i ceny biletów** | Strona nie pokazuje cen ani kategorii. eBilet 18.10 pokazywał: bilet standardowy od 234,90 zł i dopłatę VIP Fast Track od 54,90 zł (szybsze wejście, nie zastępuje biletu). Jeśli mamy to pokazać, potrzebna decyzja; wtedy można też przywrócić pytanie FAQ o VIP. |
| 13 | **Spółka organizatora** | Regulamin mówi, że organizatorem może być L2L sp. z o.o. albo 828 Studio sp. z o.o. W stopce wpisano L2L sp. z o.o. (ul. Opoczyńska 12/6, Warszawa, KRS 0001121413). |
| 14 | **Role partnerów w stopce** | Układ w stopce: Organizator: Live2Listen · Partnerzy: Atlas Arena, Koolwaters, Booking Artist Agency · Kontakt: formularz Live2Listen (kolumna „Bilety” usunięta 18.10). Do potwierdzenia: czy Atlas Arenę opisać jako obiekt, a Booking Artist Agency jako booking. |
| 15 | **Kontakt do organizatora** | ✅ Formularz kontaktowy na stronie Live2Listen (live2listen.com/#kontakt). Regulamin i polityka prywatności linkują do stron Live2Listen (oświadczenie opiekuna jest w sekcji „Dokumenty” regulaminu). |
| 16 | **Dojazd i parkingi** | Strona odsyła do atlasarena.pl. Jeśli organizator ma własne wskazówki (parking, komunikacja, wejścia), warto je dodać. |
| 17 | **Dostępność dla osób z niepełnosprawnościami** | Odpowiedź oparta na FAQ Live2Listen. Brakuje kontaktu w sprawie dostępności i informacji Atlas Areny. |
| 18 | **Podpisy zdjęć w galerii** | Podpisy opisują kadr, bez nazw wydarzeń. Do uzupełnienia: miejsce, data i autor (fotograf) każdego zdjęcia oraz potwierdzenie praw do publikacji. |
| 19 | **Liczby wyświetleń na TikToku** | Pobrane 11.10.2026 z oficjalnego profilu @padreguilherme. Przed startem warto je odświeżyć (zmieniają się codziennie). Strona nie sumuje wyświetleń. |
| 20 | **DJ Mag #79** | Potwierdzone na djmag.com (profil artysty w Top 100 DJs 2026). Opis zaznacza, że ranking powstaje z głosowania fanów. |
| 21 | **„Około 1,5 mln” na ŚDM w Lizbonie** | Szacunek podawany w mediach dla porannego setu 6.08.2023. |
| 22 | **Skytech: linki do muzyki** | Strona skytechmusic.com działa, ale blokuje automatyczne sprawdzenie (CAPTCHA). Jeśli Skytech ma oficjalny Spotify lub YouTube, możemy je dodać. |

## Przed wdrożeniem (technika)

- Hosting z kompresją gzip lub brotli i długim cache dla `assets/` (przykład w README). Bez kompresji LCP na telefonie wynosi 2,9 s zamiast 2,1 s.
- Po ustawieniu domeny: `npm run html`, `npm test`, Lighthouse na docelowym serwerze.
- Testy w Safari (iOS/macOS) i Firefoxie: w tym środowisku był dostępny tylko Chromium.
