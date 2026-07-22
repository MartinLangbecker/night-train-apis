# Leo Express API

## Endpoints
- GraphQL: `POST https://graph.leoexpress.com/le` (introspection enabled, 158 types)
- REST: `https://www.leoexpress.com/api/*` (session-based, requires browser cookies)

## Authentication
Search, carriers, delays, stations, tariffs, services, and facilities require no auth.
Booking uses `order_code` + `digest` (base64 token from order creation).
User account operations require a `token` from `loginUser` mutation.

## Deep Links
No deep-link support. The booking UI is a single-page application (Nuxt/Vue). No URL parameters, hash routing, or way to link to a specific search/connection.

## Key Operations (GraphQL)

### searchConnections
Search trains between two stations with pricing per class.
```json
{"operationName": "searchConnections", "variables": {"from": "8002041", "to": "5100234", "date": "08.08.2026", "persons": [{"name": "adult", "cards": []}], "services": [], "locale": "de", "currency": "EUR", "platform": "website"}}
```
Returns connections with `hash` (used to create order), multi-class pricing, stops, and transfer info.

Additional undocumented params: `from_lat`, `from_lon`, `to_lat`, `to_lon`, `from_address`, `to_address` (for D2D shuttle service, currently inactive).

### createOrder (mutation, preferred over REST)
```json
{"variables": {"input": {"hash": "<from search>", "class": "7", "classCombination": [{"line": "LE235", "class": "7"}]}, "locale": "de", "platform": "website"}}
```
Returns `order.code`, `order.digest`, assigned tickets with seats. No browser cookies needed.

### deleteOrder (mutation)
```json
{"variables": {"order_code": "261991397251110", "locale": "de"}}
```

### orderData
Retrieve full order details (tickets, seats, departure/arrival times).
```json
{"variables": {"orderId": "43663293", "digest": "<base64>", "locale": "de"}}
```

### stations
Returns all 189 stations with GPS coordinates, country, type, parent grouping.
```json
{"variables": {"locale": "de"}}
```

### ride
Full ride detail with GPS per stop, car composition, distance.
```json
{"variables": {"id": 1077158, "locale": "de"}}
```

### delaysByStation
Live delays filtered by station ID.
```json
{"variables": {"station": "5457076", "locale": "de"}}
```

### tariffsArray
All 98 tariff/discount types with rules, age ranges, country restrictions.

### services
8 add-on services: ski (3), bicycle (4), parking (5), all-day bike (6), dog (7), seat reservation (10), ThermalPass (11), seat catering (12).

### facilities
30 on-board amenity types (WiFi, power, AC, steward, sleep set, free coffee, etc.)

### timetables
Static timetable data with calendar validity. Optional `type` filter: `train`, `bus`.

### delaysQuery / filteredDelaysQuery
Live train positions with GPS, speed, bearing, delay.

### carriers
List all 9 carriers.

### priceGardenQuery
Calendar-view daily prices for a station pair. Only works for CZ domestic routes (Praha–Pardubice–Olomouc–Ostrava corridor). Returns ~145 days ahead. Flag `bP` = best price day.
```json
{"variables": {"from": "5457076", "to": "5434364", "currency": "EUR", "locale": "de", "platform": "website"}}
```

### minPricesQuery / connectionInfoQuery / creditExchangeRatesQuery
- `minPrices`: All origin-destination pairs with minimum prices. Returns 22,147 routes across 229 station IDs. Contains 77 internal IDs (mostly dead Lux Express/Baltic bus stops) not resolvable via `stations` query.
- `creditExchangeRates`: Internal fixed rates — CZK (ratio=1), EUR (24), PLN (5). Set dates: 2015, 2019, 2022.

### checkSalecodeRemains
Validate a promo/discount code. Returns discount %, remaining uses, expiry date, conditions (class restrictions, cumulative rules).
```json
{"query": "query { checkSalecodeRemains(salecode: \"CODE\", locale: \"de\") { salecode { code mode sale remain currency expiration_at conditions { class_id multiple wholeorder cumulative } } error { code message } } }"}
```
Error 1060 = "Neplatný slevový kód" (invalid code). Historical codes (LEO10, ZDARMA, etc.) are all expired.

### carsWithFreeSeats
Seat map with car layout (base64 SVG) and free seat list per class.

### orderPaymentMethodsExt
Available payment methods: Google Pay (32), Card (101), Bank transfer (134), Apple Pay (143), Bitcoin (144).

## Station Identifiers
- EVA numbers: `8002041` (Frankfurt Süd), `8010366` (Weimar), `8010101` (Erfurt)
- Internal codes: `PRZEMYSL`, `PRAHA`, `OSTRAVA`, `DRESDEN`, `VARSAVA`, `KRAKOW`
- Polish codes: `5100234` (Przemyśl Główny), `5102825` (Przemyśl Zasanie)
- Czech codes: `5457076` (Praha hl.n.), `5434364` (Ostrava hl.n.)

### Meta-Stations (parent groups, 16 total)
Using the `short` code in search returns results for all child stations.
Key codes: `PRZEMYSL` (Główny + Zasanie), `PRAHA` (hl.n., Libeň, Holešovice, Vršovice), `OSTRAVA` (hl.n., Svinov), `DRESDEN` (Hbf, Neustadt), `VARSAVA` (5 stations), `BRATISLAVA` (5 stations), `KRAKOW` (3 stations).

### Frankfurt Stations
- `8002041` = Frankfurt (Main) Süd — LE235 origin, the only Frankfurt stop
- `8070003` = Frankfurt (M) Flughafen Fernbf — served by LE232/LE235 from Sep 21, 2026 (Mon–Fri)

## Night Train LE235
Frankfurt (Main) Süd → Przemyśl Główny (overnight, ~20h, 1193 km)
Route: Frankfurt/Main-Süd → Offenbach → Hanau → Fulda → Eisenach → Gotha → Erfurt → Weimar → Apolda → Naumburg (Saale) Hbf → Weißenfels → Leipzig Hbf (tief) → Dresden-Neustadt → Dresden Hbf → Bad Schandau → Děčín → Ústí nad Labem → Kralupy nad Vltavou → Praha-Holešovice → Praha hl.n. → Praha Vršovice → Pardubice → Ústí nad Orlicí → Zábřeh na Moravě → Olomouc → Hranice na Moravě → Suchdol nad Odrou → Studénka → Ostrava-Svinov → Ostrava hl.n. → Bohumín → Oświęcim → Kraków Główny → Kraków Płaszów → Bochnia → Brzesko Okocim → Tarnów → Dębica → Ropczyce → Sędziszów Małopolski → Rzeszów Główny → Łańcut → Przeworsk → Jarosław → Radymno → Przemyśl Zasanie → Przemyśl Główny

Train numbers: LE235/IC 235 (eastbound), LE232/IC 232 (westbound). Runs as "LEO" on German side, "IC" on Czech side.
Carrier: Leo Express (id:1)

Schedule:
- Frankfurt Süd 15:03 → Przemyśl 11:25 (+1)
- Przemyśl 12:04 → Frankfurt Süd 07:22 (+1)
- From Sep 21, 2026 (Mon–Fri): extends to/from Frankfurt Flughafen Fernbf (dep 14:39 / arr 07:53)

The Polish section (Bohumín → Przemyśl) follows separate timetable periods. Polish timetable changes on Aug 30 — stops beyond Bohumín may change.

Sleeper cars debut July 31, 2026. Searching earlier dates still shows sleeper availability but assigns July 31 departure.

Car composition (RIC coaches):
- RIC B4-1: Economy (class 3)
- RIC B3-1: Business (class 1)
- RIC B6-1: Economy Sleeper (class 7) + Economy Sleeper Lady (class 8)

## Travel Classes
| ID | Short | Name | Vehicles | Typical price (Frankfurt–Przemyśl) |
|----|-------|------|----------|-----|
| 1 | BUS | Business | FLIRT, RIC, Talgo | 42€ |
| 2 | PRE | Premium | FLIRT only | 91–102€ |
| 3 | ECO | Economy | FLIRT, RIC, Talgo, Bus | 18–42€ |
| 4 | ECOPLUS | Economy Plus | FLIRT only | 29–49€ |
| 7 | ECOSLEEPER | Economy Sleeper | RIC (night train) | 42€ |
| 8 | ECOSLEEPERLADY | Economy Sleeper Lady | RIC (night train) | 42€ |

Prices are dynamic. From intermediate stations (e.g. Weimar): ~34-38€.

## Fleet & Car Composition

### Stadler FLIRT EMU (scheme: `flirt`)
5-car EMU on Praha↔Warszawa (LE4xx-PL lines).

| Car | Name | Classes | Description |
|-----|------|---------|-------------|
| 5 | STADLER_A | ECO (3) | Economy + family area (Kinderabteil) |
| 4 | STADLER_D | ECO (3) | Economy open |
| 3 | STADLER_E | ECO (3) | Economy open |
| 2 | STADLER_C2020 | ECO (3) + ECOPLUS (4) | Economy Plus: ergonomic leather seats, laptop desk, included refreshments |
| 1 | STADLER_B | BUS (1) + PRE (2) | Business + Premium (6-seat quiet compartment, reclining/sleeping seats, premium menu) |

- `kontent_hashtag` pattern: `{class}_train_lcz_flirt`
- Premium not available on night departures (LE419-PL)

### RIC Loco-Hauled Coaches (scheme: `ric`)
On CZ main corridor (LE12xx), Bratislava (LE1215), and night train (LE235).

**Daytime (LE1253, LE1258, etc.):**
- RIC KUPE BUS 1: Business compartment (class 1)
- RIC E1, E2, E3: Economy open (class 3)

**Night train LE235:**
- RIC B4-1: Economy (class 3)
- RIC B3-1: Business (class 1)
- RIC B6-1: Economy Sleeper (class 7) + Economy Sleeper Lady (class 8)

**Some trains (LE1255):**
- RIC KUPE ECO 1: Economy compartment (class 3)
- RIC B4-1: Economy (class 3) — no Business on this service

### Talgo (scheme: `talgo`)
Loco-hauled Talgo coaches on CZ main corridor (LE1255 and LE1265, Praha→Bohumín).
- Economy and Business classes only (no Premium/Economy Plus)
- **12 cars**: Talgo 1 (Business), Talgo 2 (Business+Economy), Talgo 3 (bistro, no class), Talgo 4–12 (Economy)
- 177 Economy + 25 Business = 202 total seats
- 1 meter seat pitch in Economy (largest in CZ 2nd class)
- Fully low-floor, barrier-free
- Bistro car, quiet zones in both classes
- Children's compartment with pram space
- 5G, AC, adjustable leather seats with headrests

**Background:** Ex-Spanish Talgo VI (S6) rakes, ~30 years old, rented from Renfe (50% owner of Leo Express since 2021). Refitted but unreliable — service launched April 30, 2026 on Praha–Bratislava and Praha–Prešov. Prešov leg cancelled after days due to breakdowns. Planned as 3 sets with tight turnarounds, no reserve. Includes a generator coach for power supply (not drawing from locomotive). Hauled by Railpool Vectron (193 class).

### LINT DMU (scheme: `lint-long`)
Diesel railcar on SK Podunajsko (43xx, 14xx) and CZ Orlicko (7xxx) regional lines.
- `transport_type=1`
- No seat map/car data exposed in API (unreserved seating)
- Carrier: Leo Express Slovensko / Leo Express Tenders

### Bus/Coach (scheme: `bus`)
Lux Express Baltic routes (EL-204xx), Leo Express buses (LEB9xxxx).
- No seat map exposed
- Carrier: Lux Express, Erabus

## Passenger Types
`adult`, `child`, `pram`, `child6`, `student`, `senior`

## Discount Cards
`cards` array in person object. Known codes:

| Code | Description |
|------|-------------|
| `isic` | Student/Lehrer (ISIC) |
| `interrailbus` | Interrail/Eurail 1. Klasse |
| `interraileco` | Interrail/Eurail 2. Klasse |
| `handicap3` | Behinderte des 3. Grades |
| `wheel` | ZTP Person mit Rollstuhl |
| `ztpwheelp` | ZTP Person mit Rollstuhl und Begleitung |
| `ztpandp` | ZTP Person mit Begleitung |
| `ztpanddog` | ZTP Person mit Assistenzhund |
| `wheelsk` | ŤZP Rollstuhl |
| `tzpwheelp` | ŤZP mit Rollstuhl und Behindertenführer |
| `tzpandp` | ŤZP mit Behindertenführer |

### Rabattregeln
- **ZTP/ZTP-P** (tschechisch): 75% Rabatt, nur Economy-Klasse, nur in Tschechien. Begleiter 100% frei.
- **ŤZP/ŤZP-S** (slowakisch): 0% Rabatt auf Fahrpreis, aber 25% Cashback in Leo Credits (Economy, gesamte Strecke).
- Rollstuhl wird kostenlos transportiert.
- Begleiter oder Assistenzhund, nicht beides gleichzeitig.
- **Interrail/Eurail**: 100% Rabatt (Preis 0 €), Reservierung obligatorisch. Nur in Zügen.
- **50% CZ-Rabatt** (Economy): child6 100% frei, child/student/senior 50%. International anteilig.
- **ISIC >26**: Kein Direktrabatt, aber 25% Cashback (Smile Club).

### Interrail/Eurail
- 100% Rabatt (Preis 0 €), Reservierung obligatorisch.
- `interrailbus` (1. Kl Pass) → Business Class.
- `interraileco` (2. Kl Pass) → Economy Class + Economy Sleeper + Economy Sleeper Lady.
- Nur in Zügen, nicht in Bussen.
- **Programmatisch buchbar via API** — `createOrder` mit Interrail-Hash ergibt order mit price=0€ und zugewiesenem Sitzplatz. Nützlich für automatische Verfügbarkeitsprüfung und Reservierung.

**Offizielle Zuordnung (leoexpress.com):**
- 2. Kl Pass → Economy
- 1. Kl Pass → Economy Plus + Business

**API-Verhalten (Stand Juli 2026):**
- `interraileco` gibt Economy + Sleeper + Sleeper Lady zurück (0€) — Sleeper vermutlich unbeabsichtigt (LE235 ist neu)
- `interrailbus` gibt nur Business zurück (0€)
- 1. Kl Passinhaber können auch `interraileco` nutzen (freiwilliges Downgrade in niedrigere Klasse)

### Economy GO (Stehplatz)
- Verfügbar wenn alle Sitzplätze ausverkauft (oder als Kombination Stehen+Sitzen)
- Max 4 Personen gleichzeitig pro Verbindung
- Max Stehzeit: 2h 15min
- Nur Tarife `adult` und `student`
- Nur auf FLIRT-Fernverbindungen (Klappsitze in Wagen 2 oder 4)
- In API: `class_info.standing = true` kennzeichnet Stehplatz-Pricing
- Kein Catering-Service während Stehplatzabschnitt

## Booking Flow (GraphQL, preferred)
1. `searchConnections` → hash per connection
2. `createOrder` mutation (hash + classCombination) → order_code + digest + tickets with seats
3. `carsWithFreeSeats` (ticket_id) → seat map (SVG + free seats)
4. `changeSeat` mutation → assign specific seat
5. `orderPaymentMethodsExt` (digest) → payment methods
6. `bindOrderToUser` mutation → submit email/name
7. `getApplicationData` → application_token
8. `createGoPayPayment` mutation → GoPay redirect URL
9. `verifyGoPayPayment` mutation → confirm payment
10. `prolongOrder` mutation → extend 15-min timer

## Booking Flow (REST, legacy)
REST `/api/order/process-order` requires browser session cookies (XSRF). Prefer GraphQL `createOrder`.

## Availability Monitoring
Script: `leo-availability.py`
```
python leo-availability.py [from] [to] [month] [year] [--days N] [--json] [--diff]
```
Defaults: Frankfurt Süd → Przemyśl Główny, current month. Uses `searchConnections` per day, shows capacity + price per class. `--json` saves for change detection, `--diff` highlights price/capacity changes.

## Carriers
| ID | Name |
|----|------|
| 1 | Leo Express |
| 7 | BUS- Leo Express Global a.s. |
| 8 | Erabus Ltd. |
| 21 | ERABUS |
| 23 | Leo Express Slovensko s.r.o. |
| 24 | Lux Express |
| 25 | Transdev Slezsko a.s. |
| 555 | Leo Express Tenders s.r.o |
| 1224 | Koleje Dolnośląskie |

## Multi-Currency
EUR, CZK, PLN (set via `currency` variable)

### Internal Exchange Rates (fixed, from `creditExchangeRates`)
- 1 EUR = 24 CZK (set 2019-10-21)
- 1 PLN = 5 CZK (set 2022-09-26, i.e. 1 EUR = 4.8 PLN)

CZK is the base currency (ratio=1). All prices are set in CZK internally, EUR and PLN are derived via fixed multipliers. Query in CZK for canonical prices without rounding artifacts.

### Arbitrage
Real market rates (~25.3 CZK/EUR, ~4.3 PLN/EUR) differ from Leo's fixed rates:
- **CZK is ~5% cheaper** than EUR (Leo charges 24 CZK per EUR-equivalent, market gives you 25.3 CZK per EUR)
- **PLN is ~12% more expensive** than EUR (Leo values 1 PLN = 5 CZK, but market gives you 5.9 CZK per PLN — so you overpay in real terms)
- Recommendation: always pay in CZK if possible

On cheap domestic CZ routes (0.40€), rounding amplifies the difference to ~10%.

### Tools
- `leo-currency.py` — compare a specific connection across all 3 currencies
- `leo-network.py --stations` — full network map with multi-currency arbitrage detection
