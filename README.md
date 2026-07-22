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
- Full booking flow (search → availability → upsert → checkout via Pay.nl)
- 3 fare types: easy-night, good-night, flex-night
- 3 routes: Brussels–Prague, Brussels–Milan (from Sep 2026), Paris–Berlin
- Accommodation types: seats, couchette (4/5/6-berth), berth (single/double/triple), comfort (single/double/triple), women-only variants
- Interrail/Eurail reservations on all routes (21€ seat, 74€ couchette, 99–269€ private)
- Add-ons: bicycle (seasonal), breakfast (14€), pets (29.99€, private compartments only)
- Deep links with URL parameters for pre-filled search

### Leo Express (`leo-express-api.yaml`)
Booking API for [leoexpress.com](https://www.leoexpress.com), including:
- GraphQL-based connection search with multi-class pricing (introspection enabled, 158 types)
- Night train LE235: Frankfurt (Main) Süd → Przemyśl Główny (overnight, 1193 km via Leipzig/Dresden/Poland)
- 6 travel classes: Economy, Economy Plus, Business, Premium (FLIRT), Economy Sleeper, Economy Sleeper Lady (RIC)
- 4 fleet types: Stadler FLIRT EMU, RIC coaches, Talgo VI, Stadler LINT DMU (each with distinct car scheme)
- Live train positions with GPS, speed, bearing, and delay data (per-station filtering)
- Station database with GPS coordinates (189 stations across 8 countries)
- Seat map with SVG car layouts and free seat lists
- Full booking flow via GraphQL (search → createOrder → seat selection → payment via GoPay)
- Interrail/Eurail reservations bookable at 0€ via API (confirmed working)
- 98 tariff/discount types (Interrail, ZTP/ŤZP, Polish ULGA, family, group, corporate)
- 8 add-on services (bicycle, ski, dog, parking) and 30 on-board facility types
- Timetable data with calendar validity and exception days
- 9 carriers including Leo Express, Koleje Dolnośląskie, Lux Express, Erabus
- Multi-currency support (EUR, CZK, PLN) with fixed internal exchange rates

> [!NOTE]
> The Leo Express booking UI is a single-page application with no deep-link support.
> There is no way to construct a URL that pre-fills search parameters or links to a specific connection.

## Usage

If you're using Google Chrome, it will block all requests from SwaggerUI by default. To circumvent this, you can create a new shortcut to Google Chrome and append the following parameters: `--disable-web-security -user-data-dir=~` (note: single dash in front of `user-data-dir`). The directory for `user-data-dir` is not important, but it needs to exist on the local file system.

> [!WARNING]  
> This will disable some security features of your browser. Use at your own risk.
