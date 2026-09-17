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
- Sleeper car layout: RIC B6-1 with 10 compartments × 4 berths, strict static split (seats 1–20 Lady, 21–40 mixed)
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

### Snälltåget (`snalltaget-api.yaml`)
Booking API for [snalltaget.se](https://www.snalltaget.se), including:
- Anonymous Bearer token auth (no account needed, auto-issued on first request)
- Price calendar with cheapest-per-day, total capacity, and quota-at-tier fields
- Journey search with direct train filtering (single-leg routes)
- 5 product families: seats (non-flex/semi-flex/full-flex), couchettes (full-flex/semi-flex)
- 3 comfort zones: NRR (non-refundable), REBOOK, REFUND
- Route: Berlin/Hamburg ↔ Stockholm (D 10300/10301) via Malmö, Norrköping, Linköping
- Station codes use names for German cities (`Berlin`, `Hamburg`) and numeric IDs for Swedish (`740000001`)
- Cloudflare-protected (realistic User-Agent required)

### SJ (`sj-api.yaml`)
Booking and traffic information API for [sj.se](https://www.sj.se), including:
- REST API with subscription key auth (no login, no captcha)
- Full booking flow (search → departures → offers → provisional booking → payment via Worldpay/Swish)
- EN 344/345: Berlin ↔ Stockholm (EuroNight, operated by BTE/SJ)
- 6 night train comfort types: couchette (shared/private), sleeper 2nd (shared/private), sleeper 1st (private/solo)
- Gender selection for shared compartments (MEN, LADIES, MIXED)
- 3 flexibility tiers: NOFLEX, SEMIFLEX, FULLFLEX
- Berth position selection (LOWER_BED, MIDDLE_BED, UPPER_BED)
- 6546 stations with UIC codes and GPS coordinates
- 4 passenger categories (Adult, Child/Youth 0–25, Student, Senior)
- Discount cards (SJ Prio, Interrail/Eurail, Employee)
- Live traffic info per segment (track changes, delays, disruptions)
- 30-minute booking expiry, prices in SEK

### RDC EuroNight (`rdc-euronight-api.yaml`)
Booking API for [tickets.rdc-deutschland.de](https://tickets.rdc-deutschland.de), including:
- GraphQL endpoint (no auth, introspection disabled)
- EN 344/345: Berlin Lichtenberg / Hamburg ↔ Stockholm Central (operated by BTE/SJ)
- 4 accommodation types: Sitz, Liege (6-berth couchette), Bett (3-berth), Bett 1.Klasse (1–2 berth)
- Single-place vs. private compartment booking (IsCabinBooking flag)
- 3 price categories: Normal, Spar, Interrail
- Batch pricing queries (multiple entity types in one request)
- Traffic days: EN 344 Mo+Mi+Fr (Mi only from Hamburg), EN 345 Di+Do+Sa (Di only to Hamburg)
- 14 stations across Germany and Sweden

### Srbija Voz (`srbija-voz-api.yaml`)
Booking API for [srbvoz.rs eKarta](https://webapi1.srbvoz.rs/ekarta/app/) (Serbian Railways), including:
- REST/JSON API behind the AngularJS SPA (session-based login for booking, open search/pricing)
- Covers the whole network (IC/SOKO, IR, regional; domestic + international)
- International stations: Bar/Podgorica (Montenegro), Szeged (Hungary); Štrpci sits on a Bosnian stretch of the Belgrade–Bar line but is listed as domestic
- Night train IR 432/433 "Lovćen" as the running example: Zemun (Beograd) ↔ Bar (Montenegro, ~11h via the Belgrade–Bar line)
- Montenegro also served by seasonal daytime train 1131/1130 Subotica ↔ Bar; international online sales live since 21 July 2026 (no 5% web discount on international fares)
- Full booking flow (search → tariff → ORKA reservation → purchase via Banca Intesa redirect)
- Cross-border tariff split per administration (1062 ЖПЦГ/ZPCG Montenegro, 1172 Srbija Voz)
- Dual-currency pricing (RSD + EUR, fixed exchange rate ~119.6 RSD/EUR)
- Accommodation classes: seats (1st/2nd), couchette (ležaj), sleeper (postelja), single compartment, accompanied car
- Per-class free-place counts (`mS_SlobodnaMesta`) and full train route (`etTrasaVoza`)
- Seat/berth assignment with car, seat number and position (dole/sredina/gore)
- 2 fare types: SET za ZPCG (62), CITY STAR round-trip-to-Montenegro (68); discounts incl. SRB PLUS card (30% domestic), child 6–14 (50%), 20% return, 5% web/app
- Online refund via "Otkaži kartu" up to 24h before travel (10% fee retained); no refund after departure except on railway fault
- Account endpoints: order history (`GetPagedOrders`), profile (`korisnik`), completed-order lookup (`zavrsena`), e-mail-verified password reset
- Per-endpoint date-format quirks (YYYY-M-D / D-M-YYYY / M-D-YYYY / DD-MM-YYYY)

### ZPCG (`zpcg-api.yaml`)
API for [zpcg.me](https://www.zpcg.me) (Montenegro Railways), the Montenegro-side counterpart to Srbija Voz on the shared Belgrade–Bar line, including:
- Public, CORS-enabled REST API (`api.zpcg.me`, no auth) for timetable and pricing, plus the `tickets-zpcg.me` booking front end
- Stops carry `external_country_id` (62 ME, 72 RS) and `external_stop_id`, linking each station to its Srbija Voz `sifra` (Bar 31080, Podgorica 31001, Beograd Centar 16050)
- Direct-train search by station name; night train 432/433 "Lovćen" (international) plus local trains (Bar↔Podgorica↔Bijelo Polje, Virpazar↔Bar)
- Base fares (1st/2nd class, EUR) per relation; accommodation (Postelja/Ležaj beds 8–48€, identical to the Serbian reservation fees) and concessions (K-15 student, K-5 journalist, EURO<26/ISIC ~50%, child 6–14 50%, dogs 50%)
- Cart quote via `purchase-api.php`; payment via Monri IPG redirect (Visa/Mastercard/Maestro/Diners/Discover)
- EUR throughout (Montenegro uses the euro); dates `YYYY-MM-DD` on every endpoint
- Trilingual station names (Montenegrin Latin, English, Cyrillic)

## Usage

If you're using Google Chrome, it will block all requests from SwaggerUI by default. To circumvent this, you can create a new shortcut to Google Chrome and append the following parameters: `--disable-web-security -user-data-dir=~` (note: single dash in front of `user-data-dir`). The directory for `user-data-dir` is not important, but it needs to exist on the local file system.

> [!WARNING]  
> This will disable some security features of your browser. Use at your own risk.
