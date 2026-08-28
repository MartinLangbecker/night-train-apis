# SJ API

Booking and traffic information API for sj.se (Swedish national railway). REST, no GraphQL. Full booking flow without login.

## Base URL
`https://prod-api.adp.sj.se`

## Authentication

API key via `Ocp-Apim-Subscription-Key` header. Requires `User-Agent` header (403 without it). Two keys:

| Key | Scope |
|-----|-------|
| `d6625619def348d38be070027fd24ff6` | Booking API (`/public/sales/booking/v3/`) |
| `39296c1a13304493b44236e1bcb7f544` | Traffic Info API (`/public/trafficinfo-api/v2/`) |

No user login required for search, booking, and payment.

## Key Endpoints

- `GET /public/sales/booking/v3/config` — stations (6546), passenger types, cards, search filters
- `POST /public/sales/booking/v3/search` — create search session → `departureSearchId` + `passengerListId`
- `PATCH /public/sales/booking/v3/search/{passengerListId}` — modify search: change date, filters, add return journey (reuses session; does NOT change passenger count)
- `GET /public/sales/booking/v3/departures/search/{departureSearchId}` — train connections
- `GET /public/sales/booking/v3/departures/{departureId}/offers?passengerListId=...` — prices per comfort/flex
- `GET /public/sales/booking/v3/seats/{departureSearchId}/compartments` — compartment gender options
- `POST /public/sales/booking/v3/seats/options` — berth placement (LOWER/MIDDLE/UPPER_BED)
- `POST /public/sales/booking/v3/bookings/provisional` — create booking (30-min hold)
- `PATCH /public/sales/booking/v3/bookings/provisional/{id}/customer` — set contact info
- `PATCH /public/sales/booking/v3/bookings/provisional/{id}/passengers` — set passenger names
- `POST /public/sales/booking/v3/bookings/{id}/checkout` — initiate payment
- `GET /public/sales/booking/v3/payments/{transactionId}/poll` — poll payment status
- `POST /public/trafficinfo-api/v2/rest/segments` — live traffic status per segment

## Search Session Reuse (PATCH)

`PATCH /search/{passengerListId}` modifies an existing session without creating a new one. Accepts all fields from POST /search. The `passengerListId` stays the same; a new `departureSearchId` is returned.

Changeable per PATCH:
- `departureDate` — switch to different date
- `returnDate` — add/remove return journey
- `outboundAdditionalSearchFilters` / `inboundAdditionalSearchFilters` — change filters
- `origin` / `destination` — change route

**Not changeable per PATCH:**
- `passengers` — changing passenger count or category is silently ignored. The sj.se frontend triggers a new POST /search when the passenger count changes.

Session expires after ~40 minutes (`departureSearchExpires`). The `passengerListId` lives ~2 hours.

## Search Filters

Both `outboundAdditionalSearchFilters` and `inboundAdditionalSearchFilters` accept:

```json
{
  "onlyDirectJourneys": false,
  "allowedServiceTypes": ["SJ_NT"],
  "excludedServiceTypes": null,
  "departureDateTime": null,
  "arrivalDateTime": null,
  "viaStations": ["740000002"],
  "interchangeStations": null,
  "minTransferTimeInMinutes": null,
  "minTransferTime": null
}
```

### allowedServiceTypes / excludedServiceTypes

Whitelist or blacklist of service type codes. Values used by sj.se frontend:

| Filter preset | allowedServiceTypes |
|---|---|
| Night trains only | `["SJ_NT"]` |
| Day trains only | `["X_EXPBUS", "X_PTA", "X_TRAINOPS", "SJ_REG", "SJ_IC", "SJ_HIGH"]` |
| All trains | `null` (or omit) |

Service type codes match the `serviceType.code` from departures (see Service Types table).

### viaStations

Array of station UIC codes. Forces results through the specified station(s). Example: `["740000002"]` = via Göteborg Central.

### interchangeStations

Restrict which stations are used for transfers.

### minTransferTimeInMinutes / minTransferTime

Minimum transfer time at interchange stations. Ensures enough connection time.

### onlyDirectJourneys

`true` = no transfers. `false` or `null` = allow transfers.

## Return Journey

POST or PATCH with `returnDate` returns both `departureSearchId` and `returnDepartureSearchId`. The return search is for the reverse direction (destination → origin). Both share the same `passengerListId` — offers for both directions can be fetched without a new session.

```json
{
  "origin": "740000001",
  "destination": "740000003",
  "departureDate": "2026-09-15",
  "returnDate": "2026-09-17",
  "passengers": [{"passengerCategory": {"type": "ADULT"}}],
  "outboundAdditionalSearchFilters": {"allowedServiceTypes": ["SJ_NT"]},
  "inboundAdditionalSearchFilters": {"allowedServiceTypes": ["SJ_NT"]}
}
```

Response includes:
- `departureSearchId` — outbound (origin → destination, Sep 15)
- `returnDepartureSearchId` — return (destination → origin, Sep 17)
- `passengerListId` — shared, valid for offers on both directions

## Service Types

`serviceType` in API responses is an **object** with `code`, `name`, `modality`, `operatorName`, `ricsCode`, `externalReferences`.
The `code` field (used in search filters):

| Code | Name | Operator |
|------|------|----------|
| SJHIGH | SJ Snabbtåg | SJ (74) |
| SJIC | SJ InterCity | SJ (74) |
| SJREG | SJ Regional | SJ (74) |
| SJNT | SJ Nattåg | SJ (74) |
| SJEURO | SJ EuroNight | SJ (74) |
| XSNALL | Snälltåget tåg | Snälltåget (380) |
| XMALARTAG | Mälartåg | Mälartåg (313) |
| XORESUNDSTAG | Öresundståg | Öresundståg (300) |
| XPTA_O_TRAIN | Västtrafik tåg | Västtrafik (279) |

Search results include other operators' trains when they form part of a journey.

## Trains

EN 344/345 Berlin↔Stockholm was operated by SJ until 31.08.2026. The SJ API no longer returns EN 344/345 after August 2026 (RDC took over from Sep 2026).

SJ domestic night trains:
- Stockholm ↔ Malmö (train 1/2)
- Stockholm ↔ Östersund/Åre/Duved (train 70/71)
- Stockholm ↔ Umeå (train 91/92)
- Stockholm ↔ Luleå (train 93/94)

Norrland service halved in April 2026 (Umeå–Luleå and Boden–Narvik cut).

### Scotty Gattungen

SJ night trains use Gattung **D** in Scotty/HAFAS (not Nt or SJ).
Snälltåget day trains 3940/3941 and 306/307 use Gattung **IC**.
Snälltåget night trains D 10300/10301, D 300/301, D 24/25, D 30/31 use **D**.

### Domestic Night Train Timetables (Scotty-verified)

**D 1 Stockholm → Malmö** (7h42)
```
Stockholm Central    dep 23:17
Norrköping Central       00:54
Linköping Central        01:25
Nässjö Central       arr 02:31  dep 03:14
Alvesta station          04:03
Hässleholm Central       04:58
Helsingborg Central      06:12
Lund Central             06:45
Malmö Central        arr 06:59
```
Betreiber: SJ. Schlafwagen, Liegewagen, Bordrestaurant. ~4-5x/Woche (viele Fahrplanvarianten).

**D 2 Malmö → Stockholm** (8h04)
```
Malmö Central        dep 22:17
Lund Central             22:33
Helsingborg Central      23:13
Stockholm Central    arr 06:21
```
Nur 4 Halte (schnelle Nachtversion). 89 Fahrplanvarianten (häufige Baustellenumleitungen).

**D 70 Stockholm → Duved** (9h37)
```
Stockholm Central    dep 22:40
Arlanda Central          23:04
Uppsala Central          23:26
Gävle Central            00:40
Ånge station             04:59
Bräcke station           05:23
Östersund Central    arr 06:25  dep 06:37
Järpen station           07:33
Undersåker station       07:46
Åre station          arr 07:59  dep 08:04
Duved station        arr 08:17
```
Betreiber: SJ. Schlafwagen, Liegewagen, Bordrestaurant.

**D 92 Stockholm → Umeå** (8h47)
```
Stockholm Central    dep 21:55
Arlanda Central          22:20
Uppsala Central          22:44
Gävle Central            23:49
Söderhamn station        00:44
Hudiksvall station       01:27
Sundsvall Central    arr 02:43  dep 03:00
Härnösand station        03:53
Kramfors station         04:22
Örnsköldsvik C           05:26
Nordmaling station       06:00
Umeå Östra station       06:35
Umeå Central         arr 06:42
```

**D 94 Stockholm → Luleå** (12h23)
```
Stockholm Central    dep 18:12
Arlanda Central          18:35
Uppsala Central          19:01
Gävle Central            19:53
Söderhamn station        20:54
Hudiksvall station       21:34
Sundsvall Central    arr 22:30  dep 22:49
Härnösand station        23:42
Kramfors station         00:12
Örnsköldsvik C           01:02
Umeå Central         arr 02:08  dep 02:10
Bastuträsk station       03:45
Jörn station             04:07
Älvsbyn station          05:13
Boden Centralstation arr 05:42  dep 06:07
Sunderby sjukhus         06:23
Luleå Central        arr 06:35
```

### Competition with Snälltåget

#### Stockholm ↔ Malmö

SJ D 1/2 (night) vs Snälltåget IC 3940/3941 (day): different product segments.
- D 1 southbound: Stockholm 23:17 → Malmö 06:59 (7h42, night, sleeper/couchette)
- IC 3941 southbound: Stockholm ~16:25 → Malmö ~21:25 (~5h, day, seat only)
- IC 3940 northbound: Malmö 08:18 → Stockholm 13:17 (4h59, day, seat only)
- D 2 northbound: Malmö 22:17 → Stockholm 06:21 (8h04, night, sleeper/couchette)

Not directly competing — SJ offers overnight sleeping, Snälltåget offers daytime seating.

#### Stockholm ↔ Åre/Duved

Direct competition in summer:
- D 70: Stockholm 22:40 → Åre 08:04 (9h24, night, sleeper/couchette)
- D 24 (Snälltåget): Stockholm ~22:55 → Åre ~07:35 (~8h40, night, seat/NTB/private)

Nearly identical arrival times in Åre. D 70 runs year-round, D 24 summer only (Jun–Oct).

#### Combo: SJ D 1 + Malmö layover + Snälltåget IC 307

D 1 arrives Malmö 06:59, IC 307 departs Malmö 16:15 → Hamburg 21:57.
9h16 layover in Malmö for a day trip before continuing to Hamburg/Denmark.

Reverse: IC 306 Hamburg 09:51 → Malmö 15:35, then D 2 Malmö 22:17 → Stockholm 06:21.
6h42 layover.

See Snälltåget skill for IC 306/307 timetables.

## Passenger Categories

| Type | Age range |
|------|-----------|
| ADULT | — |
| CHILD_AND_YOUTH | 0–25 |
| STUDENT | 15–120 |
| SENIOR | 18–120 |

## Comfort Types (Night Trains)

| Code | Description | Gender required? |
|------|-------------|------------------|
| COUCHETTE_SHARED | Shared couchette (6-berth) | Yes (MEN/LADIES/MIXED) |
| COUCHETTE_PRIVATE | Private couchette | No |
| SLEEPER_SECOND_SHARED | Shared sleeper 2nd class | Yes |
| SLEEPER_SECOND_PRIVATE | Private sleeper 2nd class | No |
| SLEEPER_FIRST_PRIVATE | Private sleeper 1st class | No |
| SLEEPER_FIRST_PRIVATE_SOLO | Private sleeper 1st class, single | No |

## Flexibility Tiers

| Code | Description |
|------|-------------|
| NOFLEX | Non-rebookable, cheapest |
| SEMIFLEX | Rebookable |
| FULLFLEX | Fully flexible, refundable |

## Seat Classes (Day Trains)

| Code | Description |
|------|-------------|
| SECOND | 2nd class |
| SECOND_CALM | 2nd class quiet carriage |
| FIRST | 1st class |

## Station Codes (UIC)

| Station | Code |
|---------|------|
| Stockholm Central | 740000001 |
| Malmö Central | 740000003 |
| Göteborg Central | 740000002 |
| Berlin | 800030110 |
| Berlin Lichtenberg | 800010111 |
| Berlin Gesundbrunnen | 800010102 |
| Hamburg Hbf | 800020400 |

## Booking Flow

1. `POST /search` → `departureSearchId` + `passengerListId`
2. `GET /departures/search/{departureSearchId}` → train list with `departureId`
3. `GET /departures/{departureId}/offers?passengerListId=...` → offers with `offerId`
4. `POST /bookings/provisional` → booking with 30-min expiry
5. `PATCH .../customer` + `PATCH .../passengers` → set names
6. `POST .../checkout` → payment (Worldpay redirect for cards, Swish for mobile)
7. `GET /payments/{transactionId}/poll` → confirm payment

## Payment Methods

| Code | Description |
|------|-------------|
| HOSTED_CARD_WEB | Card (Worldpay) |
| SWISH | Swedish mobile payment |
| PRIVATE_INVOICE | Invoice |
| TRAVEL_ACCOUNT | SJ account (login required) |
| COMP_INVOICE | Company invoice (login required) |

## Prices

All amounts in SEK as strings without decimals (e.g. `"2235"` = 2235 SEK).

## Product Family Codes (in Booking Response)

| Code | Description |
|------|-------------|
| C_NON | Couchette, 2nd class, Non-rebookable |
| C_REB | Couchette, 2nd class, Rebookable |
| 1_REB | 1st class, Rebookable |
| X_2ONLY_NON | 2nd class, Non-rebookable |

## Discount Cards

| Code | Description |
|------|-------------|
| SJ_PRIO | SJ Prio loyalty card |
| UIC_INTERRAIL | Interrail/Eurail pass |
| EMPLOYEE_CARD | SJ employee card |

## Special Needs

| Code | Description |
|------|-------------|
| NO | No special needs |
| WCHAIR | Wheelchair |
| PETS | Traveling with pets |

## Berth Positions

| Code | Description |
|------|-------------|
| LOWER_BED | Lower berth |
| MIDDLE_BED | Middle berth |
| UPPER_BED | Upper berth |

## Notes

- `serviceIdentifier` is a Base32-encoded opaque token (not the train number)
- `producer` is always `SJ_ONLY` for SJ-operated trains
- Booking expires 30 minutes after creation
- No captcha or proof-of-work required
- 6546 stations in `/config` (all Swedish + many international)
- VAT included in prices and separately reported
- Fulfillment: PDF_C (customer only) or PDF_A (customer + passengers)
