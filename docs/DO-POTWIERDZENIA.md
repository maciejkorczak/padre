# Do potwierdzenia przed publikacją

Stan na 20.10.2026 (po audycie końcowym, szczegóły: docs/AUDYT-2026-10-20.md). Wszystkie punkty mają w kodzie bezpieczny punkt podłączenia: brakujące elementy są ukryte albo pokazują uczciwy komunikat. Na produkcji nie ma zmyślonych danych.

Legenda: **BLOKER**: bez tego strona nie powinna wyjść na produkcję. **WAŻNE**: do uzupełnienia przed startem kampanii. **OPCJA**: poprawi stronę, ale nie blokuje.

## Po audycie 20.10.2026: do zrobienia poza kodem

| # | Co | Status | Kto |
|---|----|--------|-----|
| A | **Łańcuch certyfikatu SSL** | **PILNE**: home.pl wysyła samopodpisany „Certum Trusted Root CA” (2018), którego nie ma Android 13 i starszy ani iOS 15. Przeglądarka w Instagramie/Facebooku na takich telefonach może pokazać błąd, WhatsApp może nie zrobić podglądu. Gotowa wiadomość do home.pl: docs/AUDYT-2026-10-20.md, punkt 1. | home.pl (zgłoszenie od właściciela konta) |
| B | **Google Search Console i Bing Webmaster** | **WAŻNE**: domena niezweryfikowana (brak rekordu TXT), Bing nie ma strony w wynikach. | Właściciel domeny |
| C | **Linki do strony** | **WAŻNE**: live2listen.com i strona wydarzenia Atlas Areny nie linkują do padreguilherme.pl; adres w bio na Instagramie, TikToku i Facebooku. | Live2Listen, Atlas Arena |
| D | **Polityka prywatności** | **WAŻNE**: polityka Live2Listen nie opisuje GA4, Meta Pixel, odbiorców, transferu do USA ani wycofania zgody; zawiera zdanie o zgodzie przez pozostanie na stronie. Patrz punkt 8. | Live2Listen / prawnik |
| E | **Meta** | Weryfikacja domeny, „Scrape Again” po wgraniu paczki, decyzja o zdarzeniach automatycznych i bramce Conversions API. | Właściciel piksela |
| G | **Statystyki /bilety i GA4** | Panel https://padreguilherme.pl/statystyki/ zapisuje wejścia na /bilety bez IP i ciasteczek (docs/WDROZENIE.md, sekcja 3a). **WAŻNE**: polityka prywatności powinna wspomnieć o tym pomiarze. Wysyłka tych wejść do GA4 jest wyłączona: włączyć (klucz API w panelu) dopiero, gdy polityka i najlepiej tekst banera opiszą pomiar serwerowy, a prawnik go zaakceptuje (baner mówi, że GA działa tylko za zgodą). | Live2Listen / prawnik, potem właściciel GA4 |
| F | **IndexNow (Bing)** | Plik klucza jest w paczce. Po wgraniu można zgłosić adres do Binga jednym zapytaniem (docs/WDROZENIE.md, sekcja 4). | — |

## Integracje i linki

| # | Co | Status | Gdzie podłączyć | Kto dostarcza |
|---|----|--------|-----------------|---------------|
| 1 | **Link do wydarzenia w eBilet** | ✅ **Link partnera Live2Listen** (decyzja Marka 19.10, prowizja): https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme?partner=l2lsp#padre-guilherme_155685,1622. Wszystkie przyciski „Kup bilet” prowadzą tam bezpośrednio; UTM z adresu wejścia są dopisywane obok `partner=l2lsp`. Nazwa sprzedawcy nie jest komunikowana w treści strony. | `config.js` → `ticketUrl` | — |
| 2 | **Domena padreguilherme.pl** | ✅ **Strona działa od 19.10.2026** pod https://padreguilherme.pl (DNS, SSL, przekierowania sprawdzone). Szczegóły: docs/WDROZENIE.md. | — | — |
| 3 | **Adresy e-mail na stronie** | ✅ Na stronie nie ma adresów e-mail (decyzja Marka 19.10). Media, partnerstwo i kontakt z organizatorem (także w FAQ): formularz Live2Listen (live2listen.com/#kontakt). | — | — |
| 4 | **Akredytacje** | ✅ Tymczasowo: przycisk „Złóż wniosek o akredytację” prowadzi do formularza kontaktowego Live2Listen (live2listen.com/#kontakt), decyzja z 19.10. Docelowy adres www.pressaccreditations.com/pl/live2listen/padreguilherme 19.10 nadal nie działał (brak certyfikatu SSL dla domeny, HTTP 404). Po naprawie: zmienić `accreditationUrl`. | `config.js` → `accreditationUrl` | Live2Listen / Press Accreditations |
| 5 | **Press pack** | **WAŻNE**: brak zatwierdzonego pliku. Przycisk „Pobierz press pack” pojawi się sam po wpisaniu adresu. | `config.js` → `pressPackUrl` | Management / Booking Artist Agency |
| 6 | **Newsletter „Bądź na bieżąco”** | **OPCJA**: formularz jest gotowy (walidacja, zgoda, honeypot, obsługa błędów), ale wyłączony. Brakuje backendu, administratora danych i polityki prywatności dla zapisu. Poprzednia wersja pokazywała fałszywe „Zapisane”; usunięte. | `config.js` → `newsletterEndpoint`, `newsletterPrivacyUrl` | Organizator (administrator danych) |
| 7 | **Analityka: GA4 i Meta Pixel** | ✅ GA4 G-MQFK04FB3F i Meta Pixel 1732539551141809 włączone (19.10), oba dopiero po zgodzie. | `config.js` → `ga4Id`, `metaPixelId` | — |
| 8 | **Polityka prywatności dla tej domeny** | **WAŻNE**: stopka i baner linkują do polityki Live2Listen. Audyt 20.10: polityka obejmuje ogólnie strony wydarzeń L2L, ale nie wymienia GA4 (G-MQFK04FB3F), Meta Pixel (1732539551141809, z bramką Conversions API), celów, okresów (`_ga` ok. 13 mies., `_fbp` 90 dni), transferu do USA ani wycofania zgody („Ustawienia cookies”), a zdanie o zgodzie przez pozostanie na stronie jest sprzeczne z banerem. Najprościej: krótka sekcja lub strona „Cookies na padreguilherme.pl” i podmiana adresu. | `config.js` → `privacyPolicyUrl` | Prawnik / organizator |

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
- Testy w Safari (iOS/macOS) i Firefoxie: w tym środowisku był dostępny tylko Chromium. Audyt 20.10 sprawdził zgodność kodu z Safari 15.4+, Firefoxem 128+, Samsung Internet i przeglądarkami w aplikacjach na podstawie danych o obsłudze funkcji (MDN, caniuse): brak elementów, które by się psuły. Warto jeszcze raz otworzyć stronę na prawdziwym iPhonie i Androidzie (także z Instagrama).
