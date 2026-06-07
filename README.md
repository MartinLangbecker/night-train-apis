# night-train-apis
A collection of reverse-engineered OpenAPI specifications for European night train booking systems.

An interactive SwaggerUI with API definitions can be found on [GitHub Pages](https://martinlangbecker.github.io/night-train-apis/).

## APIs

### ÖBB NightJet (`nightjet-api.yaml`)
Booking API for [nightjet.com](https://www.nightjet.com), including:
- Station search, route discovery, and train schedules
- Captcha-protected connection search with proof-of-work (SHA-256)
- Offer/pricing retrieval with compartment selection
- Full booking flow (prebook → payment → finalize)
- Ticket management (cancel, PDF generation, tax certificates)
- 73 discount card codes (BahnCard, Vorteilscard, Halbtax, Interrail, etc.)

### European Sleeper (`european-sleeper-api.yaml`)
Booking API for [europeansleeper.eu](https://www.europeansleeper.eu), including:
- `/constants` endpoint with full station/route/pricing configuration
- Train search and multi-currency availability (EUR, CZK, GBP, JPY, USD)
- Booking creation with fare types (easy-night, good-night, flex-night)
- Payment via Pay.nl
- 3 routes: Brussels–Prague, Brussels–Milan, Paris–Berlin

## Usage

If you're using Google Chrome, it will block all requests from SwaggerUI by default. To circumvent this, you can create a new shortcut to Google Chrome and append the following parameters: `--disable-web-security -user-data-dir=~` (note: single dash in front of `user-data-dir`). The directory for `user-data-dir` is not important, but it needs to exist on the local file system.

> [!WARNING]  
> This will disable some security features of your browser. Use at your own risk.
