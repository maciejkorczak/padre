// Treści powtarzalnych bloków strony. Każda liczba i link ma źródło — patrz docs/RAPORT.md.

export const SOCIAL = [
  { label: 'Instagram', href: 'https://www.instagram.com/padre.guilherme/', icon: 'instagram' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@padreguilherme', icon: 'tiktok' },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UC8fYSaK9MMAvDmWIOZ2r1Yw', icon: 'youtube' },
  { label: 'Spotify', href: 'https://open.spotify.com/artist/7Gl7M2tjlIWsDWYa061TWh', icon: 'spotify' },
];

// Wyświetlenia pobrane z TikToka 11.10.2026 (opisy nagrań potwierdzają miejsca).
export const TIKTOK = [
  { id: '7575124477009268001', img: 'tiktok-dreamfields', place: 'Dreamfields', where: 'Puebla, Meksyk', views: 24.6, alt: 'Kadr z nagrania: Padre Guilherme na festiwalu Dreamfields w Meksyku' },
  { id: '7648704413720202529', img: 'tiktok-tuluza', place: '„Alors en Danse”', where: 'Tuluza, Francja', views: 17.9, alt: 'Kadr z nagrania: Padre Guilherme w klubie w Tuluzie' },
  { id: '7517012418174766358', img: 'tiktok-paryz', place: 'La Clairière', where: 'Paryż, Francja', views: 16.7, alt: 'Kadr z nagrania: uśmiechnięty Padre Guilherme w La Clairière w Paryżu' },
  { id: '7672463394183630113', img: 'tiktok-untold', place: 'UNTOLD', where: 'Rumunia', views: 12.5, alt: 'Kadr z nagrania: Padre Guilherme za konsoletą na festiwalu UNTOLD' },
  { id: '7650860801443499297', img: 'tiktok-polska', place: '„Pan jest pasterzem moim”', where: 'ING Silesia Beats, Chorzów', views: 12.4, alt: 'Kadr z nagrania: publiczność pod sceną podczas występu Padre Guilherme na ING Silesia Beats w Chorzowie', highlight: true },
  { id: '7571876780286479649', img: 'tiktok-koszyce', place: 'Koszyce', where: 'Słowacja', views: 10.5, alt: 'Kadr z nagrania: scena przed oświetloną katedrą w Koszycach' },
];

// Galeria edytorska: kolejność = układ (duże, dwa mniejsze, szerokie, trzy).
export const GALLERY = [
  { img: 'galeria-05', layout: 'big', caption: 'Padre Guilherme za konsoletą, w tle wizualizacja Ziemi', sizes: '(min-width: 960px) 58vw, 100vw' },
  { img: 'galeria-02', layout: 'small', caption: 'Pomarańczowe lasery nad sceną', sizes: '(min-width: 960px) 38vw, 50vw' },
  { img: 'galeria-03', layout: 'small', caption: 'Padre Guilherme w słuchawkach, w tle światła sceny', sizes: '(min-width: 960px) 38vw, 50vw' },
  { img: 'galeria-01', layout: 'wide', caption: 'Publiczność z uniesionymi telefonami pod sceną', sizes: '100vw', pos: '50% 60%' },
  { img: 'galeria-06', layout: 'third', caption: 'Białe promienie świateł nad sceną i publicznością', sizes: '(min-width: 960px) 32vw, 100vw' },
  { img: 'galeria-07', layout: 'third', caption: 'Widok zza konsolety na plenerową publiczność', sizes: '(min-width: 960px) 32vw, 50vw' },
  { img: 'galeria-04', layout: 'third', caption: 'Widok z góry na scenę i publiczność w hali', sizes: '(min-width: 960px) 32vw, 50vw' },
];

// Plakaty z linkami do stron wydarzeń (zweryfikowane w poprzednich iteracjach).
export const POSTERS = [
  { img: 'plakat-01', title: 'Afterlife', where: 'Hï Ibiza', href: 'https://www.after.life/ibiza24', alt: 'Plakat Afterlife w Hï Ibiza z Padre Guilherme w składzie' },
  { img: 'plakat-02', title: 'Medusa Festival', where: 'Hiszpania', href: 'https://medusasunbeach.com', alt: 'Plakat: Padre Guilherme na Medusa Festival' },
  { img: 'plakat-03', title: 'Zamna Festival', where: 'Santiago, Chile', href: 'https://zamnafestival.com', alt: 'Plakat: Padre Guilherme na Zamna Festival w Santiago de Chile' },
  { img: 'plakat-04', title: 'Hï Ibiza', where: 'Recorded Live', href: 'https://soundcloud.com/padreguilherme', alt: 'Okładka miksu Padre Guilherme nagranego na żywo w Hï Ibiza' },
  { img: 'plakat-05', title: 'Input', where: 'Barcelona', href: 'https://ra.co/events/2097820', alt: 'Plakat: Padre Guilherme w klubie Input w Barcelonie' },
  { img: 'plakat-06', title: 'Lab The Club', where: 'Madryt', href: 'https://www.labtheclub.com', alt: 'Plakat: Padre Guilherme w Lab The Club w Madrycie' },
  { img: 'plakat-07', title: 'Sante Festival', where: 'São Paulo', href: 'https://www.ticket360.com.br/evento/30368/ingressos-sante-festival-2025', alt: 'Plakat: Padre Guilherme na Sante Festival w São Paulo' },
  { img: 'plakat-08', title: 'Looloo', where: 'Meksyk', href: 'https://www.ticketfairy.com/event/padre-guilherme-looloo/', alt: 'Plakat: Padre Guilherme i Ebmath w Looloo w Meksyku' },
  { img: 'plakat-09', title: 'La Clairière', where: 'Paryż', href: 'https://www.parisbouge.com/events/277549', alt: 'Plakat: Padre Guilherme w La Clairière w Paryżu' },
  { img: 'plakat-10', title: 'Dreamfields', where: 'Meksyk', href: 'https://www.nmas.com.mx/puebla/entretenimiento/musica-conciertos/dreamfields-mexico-2025-puebla-con-steve-aoki-y-charlotte-de-witte-line-up-sabado-15-y-domingo-16-noviembre/', alt: 'Plakat: Padre Guilherme na festiwalu Dreamfields w Meksyku' },
];

const OSWIADCZENIE = { href: 'assets/docs/oswiadczenie-opiekuna-maloletniego.pdf', label: 'Oświadczenie opiekuna małoletniego (PDF)' };
const REGULAMIN = { href: 'assets/docs/regulamin-live2listen.pdf', label: 'Regulamin wydarzeń Live2Listen (PDF)' };
const ODSPRZEDAZ = 'Bilety na wydarzenia Live2Listen nie podlegają standardowemu zwrotowi, z wyjątkiem przypadków przewidzianych w przepisach prawa lub regulaminie sprzedaży. Jeśli nie możesz przyjść, skorzystaj z oficjalnej odsprzedaży w aplikacji eBilet — będzie dostępna najpóźniej tydzień przed koncertem.';

// 12 pytań w kolejności z briefu. `unconfirmed` = brak potwierdzonej odpowiedzi:
// pytanie widać tylko w podglądzie, na produkcji jest pomijane (nie publikujemy pustych odpowiedzi).
export const FAQ_MAIN = [
  { q: 'Gdzie kupić bilety?', a: ['Oficjalna sprzedaż biletów prowadzona jest wyłącznie w serwisie eBilet. Kupuj tylko tam: bilety z innych źródeł mogą okazać się nieważne, a bilet nabyty z naruszeniem regulaminu może zostać unieważniony przez organizatora.'], ticket: true },
  { q: 'Kiedy i gdzie odbędzie się koncert?', a: ['W niedzielę 14 lutego 2027 roku w Atlas Arenie w Łodzi, al. Bandurskiego 7.'] },
  { q: 'O której godzinie rozpocznie się wydarzenie?', a: ['Planowany harmonogram: 18:00 otwarcie bram, 19:00 support, 20:00 Skytech, 21:00 Padre Guilherme.', 'Godziny otwarcia bram i rozpoczęcia koncertu znajdziesz też na bilecie. Dzień przed koncertem sprawdź aktualne informacje na tej stronie. Przyjdź wcześniej, żeby uniknąć kolejek przy wejściu.'], note: 'Godziny do potwierdzenia przez organizatora.' },
  { q: 'Jak dojechać do Atlas Areny?', a: ['Atlas Arena znajduje się przy al. Bandurskiego 7 w Łodzi. Organizator zachęca do korzystania z komunikacji miejskiej lub taxi — oszczędzisz czas na szukaniu miejsca parkingowego.'], links: [{ href: 'https://atlasarena.pl', label: 'Dojazd i parkingi: atlasarena.pl', external: true }], note: 'Do uzupełnienia: szczegóły parkingu i komunikacji (organizator / Atlas Arena).' },
  { q: 'Czy dostępne są miejsca siedzące?', unconfirmed: true, a: ['DO UZUPEŁNIENIA: układ sali i kategorie biletów (płyta, trybuny) — czekamy na potwierdzenie organizatora. Na produkcji pytanie pojawi się dopiero z potwierdzoną odpowiedzią.'] },
  { q: 'Czy można kupić bilety VIP?', unconfirmed: true, a: ['DO UZUPEŁNIENIA: czy w sprzedaży będą bilety VIP i co obejmują. Na produkcji pytanie pojawi się dopiero z potwierdzoną odpowiedzią.'] },
  { q: 'Czy osoby niepełnoletnie mogą uczestniczyć?', a: [
    'Tak. Osoby, które ukończyły 16 lat, mogą wejść samodzielnie z ważnym biletem i dokumentem potwierdzającym wiek. Brak dokumentu oznacza odmowę wstępu bez opiekuna.',
    'Osoby poniżej 16 lat mogą uczestniczyć w koncercie wyłącznie pod opieką osoby dorosłej i na jej odpowiedzialność. Bilet jest potrzebny zarówno dla dziecka, jak i dla opiekuna, a opiekun musi mieć wypełnione oświadczenie opiekuna małoletniego. Jedna osoba dorosła może być opiekunem maksymalnie pięciorga niepełnoletnich.',
    'Dzieci, które w dniu koncertu nie mają ukończonych 3 lat, wchodzą bezpłatnie. Zabierz dokument potwierdzający ich wiek i słuchawki ochronne.'], links: [OSWIADCZENIE, REGULAMIN] },
  { q: 'Jak wygląda dostępność dla osób z niepełnosprawnościami?', a: [
    'Jeśli osoba z niepełnosprawnością przychodzi z opiekunem, bilet potrzebny jest dla każdej z tych osób.',
    'Jeśli na planie sali nie ma oznaczonych miejsc dla osób poruszających się na wózkach, kup dowolny bilet — obsługa na miejscu wskaże bezpieczne miejsca przygotowane dla osób z niepełnosprawnościami. Jeśli potrzebujesz dodatkowego wsparcia, zgłoś się do obsługi widowni.'], note: 'Do uzupełnienia: kontakt w sprawie dostępności i informacje Atlas Areny.' },
  { q: 'Czy bilety można przekazać innej osobie?', a: ['Tak, bilet możesz przekazać innej osobie w aplikacji eBilet.', ODSPRZEDAZ] },
  { q: 'Jak skontaktować się z organizatorem?', a: [
    'Organizatorem koncertu jest Live2Listen (L2L sp. z o.o.). W sprawach zakupu biletu, braku biletu w e-mailu lub kodu QR kontaktuj się z eBilet.'], contacts: [
    { label: 'Organizator', email: 'hello@live2listen.com' },
    { label: 'Rzeczy zgubione na koncercie', email: 'lost@live2listen.com' },
    { label: 'Media', email: 'media@padreguilherme.pl' },
    { label: 'Partnerstwo', email: 'info@padreguilherme.pl' }], note: 'Adres hello@live2listen.com pochodzi z regulaminu (szatnia) — potwierdzić jako kontakt ogólny.' },
  { q: 'Co w przypadku zmiany terminu?', a: ['Jeśli koncert zostanie przeniesiony na inny termin lub do innego obiektu, kupione bilety zachowują ważność i nie trzeba ich wymieniać. O zmianie poinformuje Cię e-mailem dystrybutor biletów, a organizator opublikuje informację w swoich kanałach i na tej stronie.'] },
  { q: 'Co w przypadku odwołania wydarzenia?', a: ['Jeśli wydarzenie zostanie odwołane, przysługuje Ci zwrot pieniędzy za bilet. Skontaktuj się z dystrybutorem biletów, czyli z eBilet.'] },
];

// Pozostałe pytania z FAQ organizatora (zachowane z poprzedniej wersji strony).
export const FAQ_MORE = [
  { q: 'Co muszę mieć ze sobą, aby wejść na koncert?', a: ['Bilet i dokument tożsamości.'] },
  { q: 'Czy bilet elektroniczny trzeba wydrukować?', a: ['Nie. Na wejściu pokażesz bilet elektroniczny, np. na smartfonie. Zdjęcia i zrzuty ekranu biletów nie są akceptowane.'] },
  { q: 'Kupiłem/-am kilka biletów na swoje nazwisko. Czy pozostałe osoby wejdą bez problemu?', a: ['Tak, o ile ich bilety nie zostaną wcześniej zeskanowane. Najlepiej wchodźcie razem. Każdy bilet ma unikalny kod uprawniający do jednorazowego wejścia.'] },
  { q: 'Kupiłem/-am bilet, ale nie dostałem/-am go e-mailem albo nie ma na nim kodu QR. Co robić?', a: ['Płatność mogła jeszcze nie zostać zaksięgowana. Jeśli po 24 godzinach (dniu roboczym) nadal nie masz biletu albo bilet nie ma kodu QR, skontaktuj się z obsługą klienta eBilet. Sprawdź też, czy adres e-mail przy zakupie nie zawierał literówki.'] },
  { q: 'Jakich przedmiotów nie można wnosić?', a: ['Na teren imprezy nie wolno wnosić m.in.:'], list: [
    'kamer i sprzętu nagrywającego audio i wideo',
    'profesjonalnego sprzętu fotograficznego, w tym aparatów z wymienną optyką i zoomem optycznym powyżej 6x',
    'statywów i kijków do selfie',
    'dronów',
    'dużych parasoli z ostrymi zakończeniami',
    'deskorolek, hulajnóg, rolek i podobnych pojazdów',
    'jedzenia i napojów (z wyjątkiem diety potwierdzonej zaświadczeniem lekarskim)',
    'dużych plecaków i toreb większych niż 11,4 × 16,51 cm',
    'niebezpiecznych przedmiotów, w tym broni, petard i rac',
    'alkoholu i środków odurzających'], links: [REGULAMIN] },
  { q: 'Czy mogę robić zdjęcia i nagrywać filmy?', a: ['Tak, wyłącznie do użytku prywatnego i telefonem lub aparatem bez profesjonalnych funkcji. Organizator może wprowadzić dodatkowe zasady — poinformuje o nich na tej stronie.'] },
  { q: 'Czy mogę wyjść i wrócić?', a: ['Nie. Ponowne wejście po opuszczeniu terenu imprezy wymaga nowego biletu.'] },
  { q: 'Czy będzie szatnia?', a: ['Zasady szatni zależą od obiektu, a przechowanie odzieży wierzchniej jest płatne. Sprawdź informacje na stronie Atlas Areny.'] },
  { q: 'Czy mogę przyjść ze zwierzęciem?', a: ['Nie. Ze względów bezpieczeństwa na wydarzenia Live2Listen nie można wprowadzać zwierząt.'] },
  { q: 'Zgubiłem/-am coś na koncercie. Jak to odzyskać?', a: ['Napisz na adres lost@live2listen.com i dokładnie opisz zgubioną rzecz. Organizator odezwie się, gdy ją odnajdzie.'] },
];
