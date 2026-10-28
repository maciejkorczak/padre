# Krótki adres /bilety: projekt tekstu do polityki prywatności

Stan na 20.10.2026. Projekt dla prawnika, nie gotowa porada prawna. Dotyczy pomiaru wejść na `padreguilherme.pl/bilety` (docs/WDROZENIE.md, sekcja 3a). Polityka, do której linkują baner i stopka strony, to dziś polityka Live2Listen (live2listen.com/prywatnosc); nie opisuje tego pomiaru.

## Do ustalenia przed publikacją

1. **Kto jest administratorem danych** dla padreguilherme.pl i konta hostingowego (agencja czy L2L sp. z o.o. / 828 Studio sp. z o.o.). Jeśli agencja prowadzi hosting i panel dla L2L, potrzebna jest krótka umowa powierzenia (art. 28 RODO) albo osobna informacja agencji.
2. **home.pl**: potwierdzić umowę powierzenia w regulaminie usługi i okres przechowywania dzienników serwera (zawierają adres IP, pełny adres z `fbclid`/`gclid`, przeglądarkę i dokładny czas).
3. **Podstawa prawna**: prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO) dla liczenia wejść bez cookies. Prawnik powinien świadomie zaakceptować pozostałe, niskie ryzyko interpretacyjne (art. 399 Prawa komunikacji elektronicznej / art. 5 ust. 3 dyrektywy ePrivacy w ścisłym odczytaniu wytycznych EROD 2/2023).
4. **Usuwanie**: panel usuwa zapisy starsze niż 14 miesięcy automatycznie przy pierwszym wejściu w nowym miesiącu albo przy otwarciu panelu. Po kampanii (bez ruchu) trzeba je usunąć ręcznie (docs/WDROZENIE.md, sekcja 3a), stąd data w zdaniu 2.
5. **GA4**: wysyłka wejść do Google Analytics jest wyłączona. Włączyć tylko wtedy, gdy polityka zawiera zdanie 6 poniżej, baner zostanie zmieniony, a prawnik zaakceptuje podstawę prawną. Uwaga: osoby, które odmówiły zgody w banerze, też trafiłyby do GA4, bo przy /bilety banera nie ma.

## Projekt sekcji polityki

> **Krótki adres padreguilherme.pl/bilety**
>
> 1. Gdy otwierasz krótki adres padreguilherme.pl/bilety, nasz serwer od razu przekierowuje Cię do sprzedaży biletów w serwisie eBilet i zapisuje statystykę wejścia: datę i godzinę, parametry kampanii z linku (utm_source, utm_medium, utm_campaign, utm_content, utm_term), domenę strony, z której przychodzisz, ogólny rodzaj urządzenia, systemu i aplikacji, informację, czy link zawierał identyfikator kliknięcia (np. z reklamy lub z aplikacji Meta; bez jego wartości), oraz to, czy przeglądarka wysłała sygnał „nie śledź” (Global Privacy Control lub Do Not Track).
> 2. Nie zapisujemy przy tym adresu IP ani pełnego opisu przeglądarki i nie używamy plików cookies. Dane służą wyłącznie do oceny skuteczności kampanii promujących koncert, co jest naszym prawnie uzasadnionym interesem (art. 6 ust. 1 lit. f RODO). Przechowujemy je przez bieżący miesiąc i 14 poprzednich, a po zakończeniu kampanii usuwamy je najpóźniej [data, np. 31.05.2027].
> 3. Niezależnie od tego nasz dostawca hostingu home.pl, który przetwarza dane na nasze zlecenie, zapisuje w dziennikach serwera adres IP, pełny adres otwartej strony i nazwę przeglądarki w celach technicznych i bezpieczeństwa przez [okres podany przez home.pl].
> 4. Parametry kampanii oraz identyfikatory kliknięć reklam (np. fbclid, gclid) przekazujemy wraz z przekierowaniem do eBilet, który przetwarza je jako odrębny administrator zgodnie z własną polityką prywatności. Z przycisków „Kup bilet” na stronie padreguilherme.pl przekazujemy do eBilet parametry kampanii, a identyfikator kliknięcia reklamy tylko wtedy, gdy zgodzisz się na pliki cookies marketingowe.
> 5. Możesz wnieść sprzeciw wobec tego pomiaru (art. 21 RODO), pisząc na [adres kontaktowy]. Ponieważ nie zapisujemy danych pozwalających Cię rozpoznać, zwykle nie będziemy w stanie wskazać Twoich wejść (art. 11 RODO).
> 6. *(Tylko jeśli wysyłka do GA4 zostanie włączona.)* Te same statystyki, bez adresu IP, plików cookies i stałego identyfikatora, przesyłamy do Google Analytics 4 (Google Ireland Limited, z możliwym przekazaniem do Google LLC w USA na podstawie decyzji EU-US Data Privacy Framework), chyba że Twoja przeglądarka wysyła sygnał Global Privacy Control lub Do Not Track.

## Propozycja zmiany tekstu banera (tylko przy włączeniu GA4)

> Statystyki odwiedzin (Google Analytics) na tej stronie uruchamiamy tylko za Twoją zgodą. Wejścia przez krótki link /bilety liczymy na serwerze bez cookies i przekazujemy do Google Analytics bez adresu IP i stałego identyfikatora (szczegóły i sprzeciw w polityce prywatności).
