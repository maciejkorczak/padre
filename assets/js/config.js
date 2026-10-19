/*
 * Konfiguracja strony — jedyne miejsce, w którym podłącza się integracje.
 * Puste wartości oznaczają integrację NIEGOTOWĄ: strona działa, ale odpowiedni
 * element jest ukryty albo pokazuje bezpieczny komunikat. Szczegóły: docs/DO-POTWIERDZENIA.md
 *
 * Po zmianie tego pliku uruchom `npm run html`, żeby zaktualizować index.html
 * (linki biletowe są wpisywane do HTML także dla przeglądarek bez JavaScriptu).
 */
window.PADRE_CONFIG = {
  // Strona wydarzenia w eBilet (sprzedaż od 13.10.2026). Wszystkie przyciski „Kup bilet” prowadzą tutaj.
  ticketUrl: 'https://www.ebilet.pl/muzyka/elektro-techno/padre-guilherme',
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
  metaPixelId: '1732539551141809', // Meta Pixel (ten sam, który działa po stronie eBilet)
  privacyPolicyUrl: 'https://www.live2listen.com/prywatnosc',

  // Weryfikacja domeny (opcjonalnie; alternatywa: rekord TXT w DNS home.pl).
  googleSiteVerification: '',     // Google Search Console: wartość content z meta google-site-verification
  facebookDomainVerification: '', // Meta Business: wartość content z meta facebook-domain-verification

  // Sekcje warunkowe. Support (Skytech) przywrócony 19.10.2026; harmonogram ukryty do publikacji.
  supportAnnounced: true,    // sekcja Skytech, „Support” w pasku informacji, wykonawca w danych strukturalnych
  scheduleAnnounced: false,  // sekcja „Plan wieczoru” i link „Plan” w menu

  // Odliczanie: liczba dni do wydarzenia (czas polski), bez godzin.
  eventDate: '2027-02-14'
};
