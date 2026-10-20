#!/usr/bin/env bash
# Odchudza fonty z source/fonts do assets/fonts (wymaga: pip install "fonttools[woff]==4.55.3").
# Uruchamiać tylko przy zmianie fontów. Po zmianie zawartości pliku nadaj mu nową nazwę
# i popraw ją w assets/css/main.css i w preloadach w src/index.html (pliki w /assets/ mają cache na rok).
set -euo pipefail
cd "$(dirname "$0")/.."
PL="U+0104-0107,U+0118-0119,U+0141-0144,U+015A-015B,U+0179-017C" # ĄąĆćĘęŁłŃńŚśŹźŻż
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Manrope: polskie litery (podstawowa łacina zostaje w manrope-latin.woff2).
pyftsubset source/fonts/manrope-latin-ext.woff2 --unicodes="$PL" --layout-features='*' --flavor=woff2 --output-file=assets/fonts/manrope-pl.woff2

# Saira: tylko grubości używane na stronie (500-600).
fonttools varLib.instancer source/fonts/saira-latin.woff2 wght=500:600 -o "$TMP/saira-latin.ttf"
pyftsubset "$TMP/saira-latin.ttf" --unicodes='*' --layout-features='*' --flavor=woff2 --output-file=assets/fonts/saira-latin-500-600.woff2
fonttools varLib.instancer source/fonts/saira-latin-ext.woff2 wght=500:600 -o "$TMP/saira-ext.ttf"
pyftsubset "$TMP/saira-ext.ttf" --unicodes="$PL" --layout-features='*' --flavor=woff2 --output-file=assets/fonts/saira-pl.woff2

# Pinyon Script: podstawowa łacina (hasło „Love is My Religion”).
pyftsubset source/fonts/pinyon-script-latin.woff2 --unicodes="U+0020-007E" --layout-features='*' --flavor=woff2 --output-file=assets/fonts/pinyon-script-basic.woff2

ls -l assets/fonts
