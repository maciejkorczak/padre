# Analityka i remarketing

## Stan obecny

- **Meta Pixel `1732539551141809`** jest włączony (19.10.2026) i ładuje się dopiero po zgodzie marketingowej.
- **Google Analytics 4 `G-MQFK04FB3F`** (usługa „Padre Guilherme”) jest włączony (19.10.2026) i ładuje się dopiero po zgodzie na analitykę. GTM: nie używamy.
- W GA4 warto dodać wymiar niestandardowy `cta_location` (Administracja → Definicje niestandardowe, zakres: zdarzenie) i oznaczyć `click_buy_ticket` jako zdarzenie kluczowe.
- Kod pomiaru jest gotowy w `assets/js/main.js`. Zdarzenia trafiają do `window.dataLayer` (zwykła tablica w przeglądarce, bez wysyłki danych), dopóki nie zostanie wpisany identyfikator narzędzia **i** użytkownik nie wyrazi zgody.
- Identyfikatory wpisuje się w `assets/js/config.js`: `gtmId` **albo** `ga4Id` (nie oba naraz) oraz opcjonalnie `metaPixelId`.

## Zgoda (Consent Mode v2)

1. Gdy skonfigurowano jakiekolwiek narzędzie, strona ustawia `gtag('consent', 'default', …)` z wartościami `denied` dla `ad_storage`, `analytics_storage`, `ad_user_data` i `ad_personalization`.
2. Pojawia się baner: „Akceptuję”, „Tylko niezbędne”, „Ustawienia” (osobno analityczne i marketingowe).
3. Skrypty ładują się **dopiero po zgodzie**:
   - GTM: po zgodzie analitycznej lub marketingowej (tagi w GTM respektują stan zgody),
   - GA4 (bez GTM): po zgodzie analitycznej,
   - Meta Pixel: wyłącznie po zgodzie marketingowej.
4. Wybór jest zapisywany w `localStorage` (`pg_consent`). Link „Ustawienia cookies” w stopce pozwala go zmienić.

Działanie potwierdzają testy (`npm test`, sekcja 7): przed zgodą i po „Tylko niezbędne” nie ma żadnego żądania do Google ani Mety. Po zgodzie tylko na analitykę ładuje się GA4, a Meta Pixel nie.

## Zdarzenia

| Zdarzenie | Kiedy | Parametry |
|-----------|-------|-----------|
| `page_view` | Wysyła automatycznie GA4 (`send_page_view: true`) albo wbudowany wyzwalacz GTM. Strona nie wysyła drugiej kopii, żeby nie dublować odsłon. | — |
| `view_event` | Raz na wizytę, gdy sekcja „Informacje i bilety” jest widoczna w ≥ 30%. | `section: 'bilety'` |
| `click_buy_ticket` | Kliknięcie dowolnego przycisku „Kup bilet”. **To nie jest zakup.** | `cta_location` (hero, menu, bio, love, bilety, faq, final, footer, sticky), `ticket_url_ready`, `link_url` |
| `click_media` | Kliknięcie TikToka, YouTube, plakatu wydarzenia, profilu DJ Mag, kanału społecznościowego, press packu. | `media_id`, `link_url` |
| `open_gallery` | Otwarcie zdjęcia w lightboxie. | `gallery`, `image_index` |
| `submit_accreditation` | Kliknięcie „Złóż wniosek o akredytację” (przejście do Press Accreditations). Samo wysłanie wniosku mierzy system akredytacyjny. | `step: 'outbound_click'`, `link_url` |
| `newsletter_signup` | Tylko po odpowiedzi 2xx z backendu newslettera. | `form` |

Każde zdarzenie zawiera też `device_type` (mobile / tablet / desktop) i parametry kampanii z adresu (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`). Parametry są zapamiętywane w `sessionStorage` na czas wizyty.

Meta Pixel (po zgodzie marketingowej): `PageView`, `ViewContent` przy `view_event` i zdarzenie niestandardowe `ClickBuyTicket` przy `click_buy_ticket`. Nie wysyłamy `Purchase` ani `InitiateCheckout`, bo kliknięcie nie oznacza rozpoczęcia ani zakończenia zakupu.

## UTM w linku do eBilet

Przy `passUtmToTicketUrl: true` parametry `utm_*` z adresu strony są dopisywane do linku eBilet. Pozwala to organizatorowi (jeśli eBilet udostępnia mu raporty źródeł) przypisać sprzedaż do kampanii. Bez wiedzy, czy eBilet je odczytuje, nie zakładamy, że to zadziała. Do potwierdzenia z eBilet.

## Co mierzymy sami, a co wymaga partnerów

| Dane | Źródło | Kto ma dostęp |
|------|--------|---------------|
| Odsłony, źródła ruchu, kampanie (UTM), urządzenia | GA4 / GTM na tej stronie | My (po wpisaniu ID i zgodzie użytkownika) |
| Kliknięcia „Kup bilet” wg lokalizacji przycisku | `click_buy_ticket` | My |
| Wejścia na krótki adres `/bilety` (data, utm_source/medium/campaign/content, strona odsyłająca, aplikacja, urządzenie, fbclid/gclid) | Pomiar serwerowy, panel https://padreguilherme.pl/statystyki/ (bez IP i ciasteczek; docs/WDROZENIE.md, sekcja 3a) | My (hasło do panelu); opcjonalnie też GA4 jako zdarzenie `przekierowanie_bilety` |
| Zaangażowanie: TikTok, galeria, akredytacje | `click_media`, `open_gallery`, `submit_accreditation` | My |
| Grupy remarketingowe (odwiedzający, klikający „Kup bilet”) | Meta Pixel, Google Ads przez GTM | My, tylko dla osób ze zgodą marketingową |
| **Sprzedaż biletów, przychód, liczba transakcji** | System eBilet | **Organizator (Live2Listen) / eBilet**: wymaga raportów albo integracji (np. piksel lub tag konwersji eBilet na stronie potwierdzenia zakupu, eksport sprzedaży wg UTM) |
| Konwersja „kliknięcie → zakup” | Połączenie danych strony i eBilet | Wymaga współpracy z organizatorem i eBilet |
| Wysłane wnioski akredytacyjne | Press Accreditations | Live2Listen |
| Zapisy do newslettera (lista, potwierdzenia) | Backend newslettera | Administrator danych (do ustalenia) |

**Zasada:** zakupy raportujemy wyłącznie z danych eBilet. Kliknięcie w „Kup bilet” to intencja, nie konwersja.

## Do zrobienia przed kampanią

1. Ustalić, kto jest administratorem danych na padreguilherme.pl, i przygotować politykę prywatności (`privacyPolicyUrl`).
2. ✅ GA4 i Meta Pixel są wpisane.
3. W GTM: tagi GA4 i Meta z ustawieniami zgody; wyzwalacze na zdarzenia z tabeli.
4. Zapytać eBilet o raportowanie sprzedaży wg UTM i o możliwość tagu konwersji.
5. Po wdrożeniu: sprawdzić w trybie podglądu GTM / DebugView, czy zdarzenia przychodzą tylko po zgodzie.
