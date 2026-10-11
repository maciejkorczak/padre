# Padre Guilherme — Atlas Arena, Łódź, 14.02.2027

Landing page koncertu Padre Guilherme „Love is My Religion”. Statyczna strona (HTML, CSS, JavaScript bez frameworków), mobile-first, gotowa do hostingu na dowolnym serwerze plików.

- Raport z audytu i wdrożenia: [docs/RAPORT.md](docs/RAPORT.md)
- Lista rzeczy do potwierdzenia przed publikacją: [docs/DO-POTWIERDZENIA.md](docs/DO-POTWIERDZENIA.md)
- Analityka, zgody i zdarzenia: [docs/ANALITYKA.md](docs/ANALITYKA.md)
- Zrzuty ekranu przed i po: [docs/screenshots/](docs/screenshots/)

## Struktura

```
index.html                 strona produkcyjna (generowana — nie edytuj ręcznie)
src/index.html             szablon strony
src/content.mjs            treści powtarzalne: TikTok, galeria, plakaty, FAQ, social media
assets/js/config.js        KONFIGURACJA: link eBilet, akredytacje, press pack, newsletter, analityka
assets/js/main.js          interakcje, animacje, lightbox, FAQ, pomiar i zgody
assets/css/main.css        style (fonty self-hosted, tokeny, komponenty, tryb podglądu)
assets/img/                zdjęcia AVIF + JPEG w kilku szerokościach (generowane)
assets/fonts/              Manrope, Saira, Pinyon Script (woff2, latin + latin-ext)
assets/docs/               regulamin i oświadczenie opiekuna (PDF)
source/images/             oryginały zdjęć (wejście dla generatora)
design/canvas-v1/          kopia bezpieczeństwa poprzedniej wersji (kanwa projektowa)
scripts/                   build obrazów, HTML, grafik OG, podglądu i testy
```

## Praca z projektem

```bash
npm install                # sharp + playwright (przeglądarka: PLAYWRIGHT_BROWSERS_PATH lub `npx playwright install chromium`)
npm run images             # zdjęcia z source/images -> assets/img (AVIF + JPEG, srcset)
npm run html               # src/index.html + config -> index.html (produkcja, bez notatek podglądu)
npm run serve              # http://localhost:8080
npm run assets             # og-image.jpg i apple-touch-icon.png (wymaga uruchomionego serve)
npm test                   # testy funkcjonalne + zrzuty do docs/screenshots
npm test -- --links        # dodatkowo sprawdza linki zewnętrzne
npm run preview            # wersja do akceptacji z notatkami „Do potwierdzenia” -> dist-preview/site
```

## Podłączanie integracji

Wszystko w `assets/js/config.js`, potem `npm run html`:

| Ustawienie | Efekt |
|------------|-------|
| `ticketUrl` | Wszystkie przyciski „Kup bilet” prowadzą do wydarzenia w eBilet (nowa karta, z UTM). Bez tego prowadzą do sekcji #bilety. |
| `accreditationUrl` + `accreditationReady: true` | Pokazuje przycisk „Złóż wniosek o akredytację”. |
| `pressPackUrl` | Pokazuje przycisk „Pobierz press pack”. |
| `newsletterEndpoint` | Pokazuje formularz „Bądź na bieżąco” (POST JSON `{ email, consent, source, campaign }`; sukces tylko przy odpowiedzi 2xx). |
| `gtmId` albo `ga4Id`, `metaPixelId` | Włącza baner zgody i ładuje narzędzia dopiero po zgodzie. |
| `sections.poland` | Publikuje sekcję „Polska już go zna” (wymaga zatwierdzonych zdjęć). |

## Wdrożenie

Strona nie jest nigdzie automatycznie publikowana. Przed wdrożeniem przejdź listę z `docs/DO-POTWIERDZENIA.md`.

Zalecane nagłówki serwera (kompresja i cache). Przykład dla nginx:

```nginx
gzip on;
gzip_types text/css application/javascript image/svg+xml application/json;
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
location = /index.html { add_header Cache-Control "no-cache"; }
```

Netlify / Cloudflare Pages (`_headers`):

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

`npm run html` dopisuje do CSS i JS parametr wersji (`?v=` z sumą kontrolną), więc długi cache jest bezpieczny. Przy podmianie zdjęcia o tej samej nazwie trzeba zmienić nazwę pliku.
