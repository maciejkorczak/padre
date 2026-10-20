<?php
// Wzór pliku _bilety/config.php (prawdziwy plik NIE trafia do repozytorium: repozytorium jest publiczne).
// Kopię z hasłem tworzy się jako server/_bilety/config.local.php (w .gitignore); npm run dist dołącza ją do paczki.
// Hash hasła: php -r 'echo password_hash("TU_HASLO", PASSWORD_DEFAULT), "\n";'
// Hasło i klucz GA4 można też zmienić w samym panelu (/statystyki/), zapis trafia do _bilety/dane/ustawienia.json.
return [
  'panel_hash' => '',
  'ga4_secret' => '',
];
