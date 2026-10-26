# Piksel Meta: sprawdzenie (26.10.2026)

Odpowiedź na uwagę agencji z 23.10 („Nie znaleziono pikseli na tej stronie” w narzędziu „Doradca Meta ds. danych reklam”).

## Wniosek

Piksel Meta 1732539551141809 jest na padreguilherme.pl od 19.10 i działa. Uruchamia się dopiero po kliknięciu AKCEPTUJĘ w banerze cookies, bo tak wymaga prawo. Narzędzie z zrzutu ekranu ("Doradca Meta ds. danych reklam", dawniej Pixel Helper) to wtyczka do przeglądarki. Widzi piksel tylko wtedy, gdy ten faktycznie coś wyśle, więc bez kliknięcia zgody (albo z blokerem reklam) zawsze pokazuje "nie znaleziono pikseli" - to nie jest usterka. Reklamy z linkiem /bilety w ogóle omijają naszą stronę i trafiają prosto do eBilet, gdzie ten sam piksel uruchamia eBilet (też dopiero po zgodzie na cookies w ich banerze), więc w kodzie strony nie trzeba nic zmieniać, a zakupy z reklam trzeba potwierdzić po stronie eBilet i w Menedżerze zdarzeń Meta.

Sprawdzone na żywo 26.10.2026 (wysyłki zdarzeń w testach przechwytywane, nic nie trafiło do Meta ani Google):
- padreguilherme.pl: przed zgodą brak zapytań do Meta; po „AKCEPTUJĘ” piksel 1732539551141809 wysyła PageView (także do bramki Conversions API), po przewinięciu do biletów ViewContent.
- /bilety → eBilet: adres zachowuje `partner=l2lsp`, `utm_*`, `fbclid` i końcówkę `#padre-guilherme_155685,1622`. Na eBilet przed zgodą (Cookiebot) nie działa żaden piksel Meta; po „OK, zgadzam się” działają piksel eBilet 196040017456060 i piksel organizatora 1732539551141809 (PageView, ViewContent), `fbclid` trafia do ciasteczka `_fbc`.
- Piksel organizatora na eBilet uruchamia się tylko z końcówką `#padre-guilherme_155685,1622` w adresie (albo z ciasteczkiem `_mco` z wcześniejszej takiej wizyty). Bez niej działa tylko piksel eBilet.
- W konfiguracji eBilet (GTM) są zdarzenia AddToCart, InitiateCheckout, AddPaymentInfo i Purchase dla piksela organizatora w sklep.ebilet.pl (nie sprawdzone na żywo, bez zakupu).

## Zmiany w kodzie strony

NIE - żadnej zmiany w kodzie strony teraz. Piksel 1732539551141809 jest w kodzie od 19.10 (commit 598d496) i działa po zgodzie (sprawdzone).

Czego nie robić i dlaczego:
- Nie wklejać standardowego kodu Meta ani obrazka noscript do head. Piksel ruszałby przed zgodą: ciasteczko _fbp i zdarzenia wysyłane do facebook.com/tr i do bramki Conversions API. To narusza art. 399 Prawa komunikacji elektronicznej (zgoda przed dostępem do urządzenia; kary do 3% przychodu nakłada Prezes UKE, art. 446) i wymóg aktywnej zgody z wyroku TSUE Planet49. Łamie też pkt 3.d regulaminu Meta Business Tools oraz obietnicę zapisaną w dokumentacji strony, że przed zgodą nic nie trafia do Mety.
- Nie wdrażać wariantu pośredniego z fbq('consent','revoke'). Doradca i tak nie pokaże piksela, bo wykrywa tylko wysłane zdarzenia z identyfikatorem (sprawdzone w kodzie wtyczki i w teście). Samo pobranie fbevents.js wysyła przy tym do Meta IP i dane przeglądarki każdego gościa, także po "TYLKO NIEZBĘDNE" (ryzyko według wytycznych EROD 2/2023 i wyroku Fashion ID).
- Zmiana na stronie nie dołoży żadnej konwersji. Reklamy idą przez /bilety prosto do eBilet (sprawdzone na żywo: 302 z partner=l2lsp, utm_*, fbclid i #padre-guilherme_155685,1622), więc nikt z nich nie ładuje strony koncertu.
- Nie zmieniać /bilety ani linków "Kup bilet": końcówka #padre-guilherme_155685,1622 jest niezbędna, żeby eBilet uruchomił piksel organizatora.
- Nie włączać wysyłki /bilety do GA4 (dziś wyłączona, pusty klucz). Trafiłyby tam także osoby, które odmówiły zgody.

Opcjonalnie później, tylko na prośbę właściciela piksela:
- kod weryfikacji domeny Meta w config.js (facebookDomainVerification). To zwykły znacznik meta, bez śledzenia i bez ryzyka prawnego, ale do tej sprawy niepotrzebny. Alternatywa to rekord TXT w DNS.

Poza kodem:
- polityka prywatności nadal nie opisuje piksela, bramki CAPI (AWS us-east-2 / Google Cloud) ani transferu do USA (DO-POTWIERDZENIA pkt 8). To zadanie dla prawnika L2L.

## Instrukcja dla agencji

INSTRUKCJA SPRAWDZENIA PIKSELA 1732539551141809 (dla agencji)

Przygotowanie (jednorazowo):
1. Komputer z Google Chrome albo Microsoft Edge. Nie Safari, Firefox, Brave ani przeglądarka wbudowana w aplikację Facebook/Instagram.
2. Zainstaluj albo zaktualizuj rozszerzenie "Doradca Meta ds. danych reklam" (Meta Ads Data Advisor, dawniej Meta Pixel Helper) z Chrome Web Store i przypnij jego ikonę obok paska adresu.
3. Wyłącz bloker reklam i rozszerzenia prywatności (uBlock, AdBlock, Ghostery itp.) albo użyj czystego profilu Chrome z samym Doradcą. Firmowy VPN lub filtr DNS też może blokować Facebooka.

A. Strona koncertu (ok. 1 minuty)
1. Otwórz okno incognito (Ctrl+Shift+N). Rozszerzenie musi mieć włączone "Zezwalaj w trybie incognito" (chrome://extensions - Doradca - Szczegóły). Zamiast incognito możesz usunąć dane witryny: ikona obok adresu padreguilherme.pl - Pliki cookie i dane witryn - Usuń.
2. Wejdź na https://padreguilherme.pl/. Pojawi się baner cookies. Na tym etapie Doradca pokaże "Nie znaleziono pikseli na tej stronie" i to jest prawidłowe, bo przed zgodą piksel nie działa.
3. Kliknij "AKCEPTUJĘ" (albo "Ustawienia" - zaznacz zgodę marketingową - zapisz).
4. Kliknij ikonę Doradcy. Powinno być: "Na tej stronie znaleziono piksel", "Identyfikator: 1732539551141809", status aktywny, zdarzenie PageView. Jeśli lista jest pusta, odśwież stronę (F5) i kliknij ikonę ponownie.
5. Przewiń do sekcji z biletami, a dojdzie ViewContent. Kliknięcie "Kup bilet" wyśle ClickBuyTicket i przeniesie do eBilet.
6. Jeśli na tym komputerze kliknięto kiedyś "TYLKO NIEZBĘDNE", strona pamięta to przez 12 miesięcy i baner się nie pokaże. Wtedy kliknij w stopce "Ustawienia cookies", zaznacz zgodę marketingową i zapisz, albo usuń dane witryny (punkt 1).
7. Kontrola awaryjna bez wtyczki: F12 - zakładka Network (Sieć) - wpisz w filtr "facebook". Po zgodzie widać fbevents.js, signals/config/1732539551141809 i facebook.com/tr/?id=1732539551141809&ev=PageView.

B. Ścieżka z reklamy: /bilety i eBilet (ok. 1 minuty)
1. W nowym oknie incognito otwórz https://padreguilherme.pl/bilety?utm_source=test&utm_medium=test&utm_campaign=test_piksel
2. Strona od razu przenosi do eBilet. Sprawdź, czy adres w pasku zawiera partner=l2lsp, Twoje utm_* i kończy się na #padre-guilherme_155685,1622.
3. Przed zgodą Doradca pokaże "Nie znaleziono pikseli na tej stronie". To jest prawidłowe, bo eBilet też uruchamia piksele dopiero po zgodzie.
4. Kliknij "OK, zgadzam się" w banerze cookies eBilet.
5. Kliknij ikonę Doradcy. Powinny być 2 piksele: 196040017456060 (piksel eBilet) i 1732539551141809 (piksel organizatora), każdy z PageView i ViewContent.
6. Jeśli widać tylko 196040017456060, adres nie ma końcówki #padre-guilherme_155685,1622. Bez niej eBilet nie uruchamia piksela organizatora.
7. Nie przechodź do koszyka ani płatności w ramach testu. Wejścia testowe zobaczysz w statystykach /bilety jako utm_source=test.

C. Menedżer zdarzeń Meta (pewniejsze, widać też zdarzenia z serwera)
1. Menedżer zdarzeń - Źródła danych - zestaw danych (piksel) 1732539551141809. Jeśli go nie widać, właściciel piksela musi udostępnić go portfolio biznesowemu agencji i przypisać do konta reklamowego kampanii.
2. Karta "Testowanie zdarzeń" - zdarzenia z przeglądarki - wpisz https://padreguilherme.pl/ - "Otwórz witrynę". W otwartej karcie kliknij "AKCEPTUJĘ". Po kilku sekundach pojawi się PageView, a po przewinięciu do biletów ViewContent.
3. Karta "Przegląd": zdarzenia z ostatnich dni z podziałem na domeny. Powinny być padreguilherme.pl i ebilet.pl. Sprawdź, czy jest Purchase z ebilet.pl, z wartością i walutą PLN. Nowe zdarzenia mogą pojawić się z opóźnieniem do ok. 20 minut.
4. Jeśli Purchase nie ma, daj znać. Trzeba to wyjaśnić z eBilet, bo zakupy mogą trafiać do drugiego piksela przypisanego do L2L (4318311398454532).
5. Ustawienia zestawu danych - uprawnienia dotyczące ruchu: jeśli jest lista dozwolonych domen, muszą na niej być padreguilherme.pl i ebilet.pl.

D. Ustawienia kampanii pod konwersje na kreację
1. W każdej reklamie: Śledzenie - Zdarzenia w witrynie - zaznaczony zestaw danych 1732539551141809. Cel kampanii Sprzedaż, zdarzenie konwersji Zakup (po potwierdzeniu z punktu C3, że Purchase dochodzi).
2. Jedna kreacja = jedna reklama, żeby wyniki dało się porównać kreacja po kreacji.
3. Adres witryny: https://padreguilherme.pl/bilety. W polu "Parametry adresu URL": utm_source=meta&utm_medium=paid&utm_campaign=padre_lodz&utm_term={{adset.id}}&utm_content={{ad.id}} (propozycja, do uzgodnienia z agencją UTM).
4. Nie usuwać fbclid. /bilety przekazuje dalej tylko parametry utm_* i identyfikatory kliknięć (fbclid, gclid). Inne parametry, np. ad_id=, przepadają.
5. Wyniki czytaj w Menedżerze reklam na poziomie reklam: Zakupy, Koszt na zakup, Wartość konwersji. Meta przypisuje zakup do reklamy na podstawie kliknięcia, a nie UTM. Konwersji będzie mniej niż faktycznej sprzedaży, bo eBilet liczy tylko osoby, które zgodziły się na cookies.

E. Jeśli nadal "brak piksela", prześlijcie nam:
- otwierany adres;
- przeglądarkę;
- czy i którą zgodę kliknięto;
- czy działał bloker reklam;
- zrzut z F12 - Network z filtrem "facebook" zrobiony po kliknięciu zgody.

## Do wyjaśnienia

- [eBilet] Czy przy zakupie Padre Guilherme w sklep.ebilet.pl zdarzenie Purchase (z wartością i walutą) trafia do piksela 1732539551141809? W ich GTM piksel wybiera się po titleId (217632). Jeśli koszyk nie przekazuje titleId, Purchase pójdzie do piksela organizatora L2L 4318311398454532. Nie sprawdzono na żywo, bo test nie obejmował zakupu.
- [eBilet] Czy oznaczenie organizatora (ciasteczko _mco ustawiane z końcówki #padre-guilherme_155685,1622, ważne 7 dni) przetrwa całą ścieżkę zakupu: kolejkę, koszyk, płatność i powrót? Bez tego Purchase organizatora się nie uruchomi.
- [eBilet] Czy dla organizatora wysyłają zakupy także po stronie serwera, niezależnie od zgody w przeglądarce? Zaobserwowano tylko wysyłkę z przeglądarki, po pełnej zgodzie 'OK, zgadzam się'. Jaki jest mniej więcej odsetek zgód w ich banerze?
- [eBilet] Czy mogą dać raport sprzedaży tego wydarzenia według utm_source/utm_campaign/utm_content (oraz partner=l2lsp) albo dopisać identyfikator GA4 wskazany przez L2L do swojej konfiguracji organizatorów? Ich kontener to obsługuje, a dla L2L nie jest ustawione, więc dane UTM o sprzedaży trafiają dziś tylko do GA4 eBilet.
- [eBilet] Czy prowizja z partner=l2lsp nie zależy od utm_source? Do tej pory /bilety dopisywał utm_source=direct, a reklamy będą miały utm_source=meta.
- [L2L/Marek] Kto jest właścicielem pikseli 1732539551141809 i 4318311398454532? Czy zestaw danych jest udostępniony portfolio agencji i przypisany do konta reklamowego kampanii?
- [L2L/agencja] Kto prowadzi bramkę Conversions API piksela 1732539551141809 (AWS us-east-2 i zapasowo Google Cloud Run) i czy działa? Odpowiedzi bramki nie były obserwowane, bo wszystkie wysyłki w testach blokowano.
- [agencja] Na jakim adresie, w jakiej przeglądarce i w jakim stanie zgody (czy kliknięto zgodę, czy wcześniej 'TYLKO NIEZBĘDNE', czy był bloker reklam) zrobiono zrzut 'Nie znaleziono pikseli na tej stronie'?
- [agencja] Jakie konkretnie uwagi i schemat UTM proponuje agencja UTM? Czy zostaje przy /bilety (albo dokładnie tej końcówce #padre-guilherme_155685,1622)? Czy da listę 'identyfikator reklamy = nazwa kreacji'?
- [L2L/Meta] Czy w ustawieniach zestawu danych jest lista dozwolonych domen (uprawnienia dotyczące ruchu)? Jeśli tak, czy są na niej padreguilherme.pl i ebilet.pl? Tego nie widać z zewnątrz.
