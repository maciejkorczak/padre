/*
 * Konfiguracja strony — jedyne miejsce, w którym podłącza się integracje.
 * Puste wartości oznaczają integrację NIEGOTOWĄ: strona działa, ale odpowiedni
 * element jest ukryty albo pokazuje bezpieczny komunikat. Szczegóły: docs/DO-POTWIERDZENIA.md
 *
 * Po zmianie tego pliku uruchom `npm run html`, żeby zaktualizować index.html
 * (linki biletowe są wpisywane do HTML także dla przeglądarek bez JavaScriptu).
 */
window.PADRE_CONFIG = {
  // Adres KONKRETNEGO wydarzenia w eBilet (nie strona główna serwisu).
  // Do uzupełnienia po otrzymaniu linku od organizatora (Live2Listen).
  ticketUrl: '',
  // Dopisuje utm_* z adresu strony do linku eBilet (atrybucja kampanii po stronie sprzedawcy).
  passUtmToTicketUrl: true,

  // Press Accreditations (Live2Listen) — adres potwierdzony przez zespół projektu.
  // 11.10.2026 strona jeszcze nie działała (certyfikat TLS nie pasuje do domeny, HTTP 404):
  // przed publikacją sprawdź, czy formularz jest dostępny. accreditationReady: false ukrywa przycisk.
  accreditationUrl: 'https://www.pressaccreditations.com/pl/live2listen/padreguilherme',
  accreditationReady: true,

  // Zatwierdzony press pack (PDF lub folder). Przycisk pojawi się dopiero po wpisaniu adresu.
  pressPackUrl: '',

  // Endpoint newslettera (POST JSON: { email, consent, source }). Bez niego formularz się nie wyświetla.
  newsletterEndpoint: '',
  newsletterPrivacyUrl: '',

  // Analityka. Ładowana dopiero po zgodzie użytkownika (Consent Mode v2, domyślnie „denied”).
  // Wpisz GTM ALBO GA4 — nie oba naraz, żeby nie dublować pomiaru.
  gtmId: '',
  ga4Id: '',
  metaPixelId: '',
  privacyPolicyUrl: 'https://www.live2listen.com/prywatnosc',

  // Odliczanie do otwarcia bram (godzina do potwierdzenia przez organizatora).
  countdownTarget: '2027-02-14T18:00:00+01:00'
};
