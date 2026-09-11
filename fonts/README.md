# Local font assets

These Latin and Latin-extended WOFF2 subsets retain the homepage's typography while removing requests to Google Fonts at page load. Only the styles used by the site are included, with `font-display: swap`:

- Fraunces: regular 500 and italic 400; see `fraunces-OFL.txt`.
- Newsreader: regular 400/600 and italic 400; see `newsreader-OFL.txt`.
- Homepage Mono: regular 400/500, derived from IBM Plex Mono; see `ibmplexmono-OFL.txt`. The modified subset is renamed because the original license reserves the name “Plex”.

Chinese and other characters outside the subsets use system fallback fonts. `sources.json` records the original Google Fonts download URLs. Run `python3 scripts/generate_fonts.py` from the repository to reproduce the subsets (requires `fonttools[woff]` and network access).
