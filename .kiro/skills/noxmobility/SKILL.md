# NOX Mobility API

Reverse-engineered booking API of [NOX](https://noxmobility.com), a German night-train startup. The website (`noxmobility.com`) is a Next.js app that calls the public JSON API at `api.noxmobility.com` directly. Reverse-engineered from a full booking flow on the overnight train **1791 Hamburg Hbf → München Hbf** (~10h 51m, via Bremen and Augsburg).

## Base URL

```
https://api.noxmobility.com      # public REST/JSON, no auth, CORS-enabled (Origin: https://noxmobility.com)
```

## Auth

None. Every endpoint is unauthenticated, no token or cookie. Writes send an `OPTIONS` preflight. Payment card data never touches this API (handed to SumUp).

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tariff-classes` | GET | Fare classes (Basic, Flex) |
| `/api/geo/trips/autocomplete?q=&limit=&types=` | GET | Station/municipality type-ahead |
| `/api/trips/fare-calendar?from=&to=&dateFrom=&dateTo=&adults=` | GET | Cheapest price per day |
| `/api/trips/search?from=&to=&date=&adults=&limit=` | GET | Trips for one date, prices + availability |
| `/api/trips/{tripId}/prepare` | POST | Lock price (JWT), resolve ancillaries |
| `/api/bookings` | POST | Create reservation (~30-min hold) |
| `/api/bookings/{bookingId}/ancillaries` | POST | Add an add-on to an existing booking |
| `/api/bookings/{bookingId}/pay` | POST | Initiate SumUp payment |
| `/api/discount-codes/validate` | POST | Validate a discount code |
| `/api/health` | GET | Liveness (`{status, database}`) |
| `/api/stations` | GET | Full station master data (incl. planned/non-main) |
| `/api/trips` | GET | Raw timetable (all dated trips) |
| `/api/trips/{tripId}` | GET | Single trip detail incl. `train` object |
| `/api/discount-codes` | GET | Admin list — **401 without auth** |

All discovered by probing; the site itself only calls the first eight. `/docs` (on the API host root, not under `/api`) serves the Swagger UI, but the JSON source (`/api-json`, `/openapi.json`) is not exposed.

## Conventions

- **IDs**: stations, municipalities, tariff classes, trips, bookings, ancillaries are all UUID v4.
- **Dates**: `YYYY-MM-DD` for query dates. Trip timestamps are ISO 8601 local, no zone offset (`2027-03-28T21:22:42`).
- **Currency**: EUR throughout. Prices are plain numbers; `tariff-classes.basePrice` is a decimal string (`"50.00"`).
- **Languages**: names are `{de, en, default}`; `Accept-Language: de|en` selects labels.

## Stations / Autocomplete

`GET /api/geo/trips/autocomplete?q=Ham&limit=8&types=municipality,station`

Returns municipalities (a city grouping stations) and stations. A **municipality id** is used directly as `from`/`to`. Municipality `codes.db` = DB short code (`HH`, `M`, `HB`, `A`); stations carry `codes.plc` + `codes.uic`.

```json
{"type":"municipality","id":"aa8c46ab-660f-4a1d-9422-1dd1d1d8e045",
 "names":{"de":"Hamburg","en":"Hamburg","default":"Hamburg"},
 "codes":{"db":"HH"},"countryCode":"DE",
 "location":{"latitude":"53.551086","longitude":"9.993682"}}
```

Known municipality ids: Hamburg `aa8c46ab-660f-4a1d-9422-1dd1d1d8e045`, München `9fb61762-46bf-462f-9e1a-a859d96a87ac`, Bremen `9b341d10-f83b-4a5a-bf31-88b19fdb2d00`, Augsburg `6469cec1-d997-4e19-a7ff-ba4a0e85e769`.
Station ids: Hamburg Hbf `0526883c-…` (UIC 8002549), München Hbf `2039076a-…` (UIC 8000261), Bremen Hbf `c9acb25b-…` (8000050), Augsburg Hbf `e2af102e-…` (8000013).

**The whole network is these 4 cities** — autocomplete only matches a prefix of Hamburg / Bremen / Augsburg / München and their Hbf stations; no other city resolves.

## Station master data — `GET /api/stations`

Fuller than autocomplete: 6 stations, each with a nested `municipality{…, region}` plus `municipalityId`, `officialName`, `stationCode`, `eva`, `plc`, `ibnr`, `status`, `address`, `timezone` (`Europe/Berlin`), `isMainStation`, `archivedAt`, `createdAt`/`updatedAt`.

```json
{"id":"0526883c-…","municipality":{"id":"aa8c46ab-…","names":{…},"codes":{"db":"HH"},"region":"Hamburg","latitude":"53.551086","longitude":"9.993682"},
 "municipalityId":"aa8c46ab-…","names":{"de":"Hamburg Hbf",…},"codes":{"plc":"DE 14393","uic":"8002549"},
 "officialName":"Hamburg Hbf","eva":null,"plc":"DE 14393","ibnr":null,"status":"planned",
 "timezone":"Europe/Berlin","isMainStation":true}
```

- All 6 have `status: "planned"` (pre-launch; the service starts 2027).
- Two non-main stations exist that autocomplete does NOT surface: **Hmb-Langenfeld Bbf** (`DE 14461`) and **Mü-Pasing Bbf** (`DE 17306`), both `isMainStation:false`, no `uic` — not bookable endpoints, likely operational (Betriebsbahnhof) waypoints.

## Timetable — `GET /api/trips`

Raw dated trips (no params). Fields: `id` (= tripId), `timetableId`, `date`, `trainId`, `trainNumber`, `locomotiveName`/`locomotiveId` (null pre-launch), `status`, `isAssignmentLocked`, `seatAllocationFrozenAt`, `seatAllocationCommunicatedAt`, `simulationOriginDepartureAt`.

- Season runs **2027-03-23 → 2027-12-10**, ~6 days/week (one rest day each week).
- Two train numbers alternate by day: **1791 = southbound Hamburg→München**, **1790 = northbound München→Hamburg**. Same physical unit named **NOX2** (`train.name`, via trip detail).

## Trip detail — `GET /api/trips/{tripId}`

Same as the timetable row plus an embedded `train` object:

```json
{"id":"d5d022c5-…","timetableId":"8c746851-…","date":"2027-03-28",
 "train":{"id":"76e1c43e-…","name":"NOX2","description":null,"trainNumber":"1791","isActive":true},
 "trainNumber":"1791","status":"bookable","isAssignmentLocked":false,…}
```

## Health — `GET /api/health`

`{"status":"ok","database":"ok"}`. Liveness + DB check.

## Errors (NestJS envelope)

The backend is NestJS; failures use a standard envelope. Validation (`class-validator`) returns `message` as an **array** of strings; other errors as a single string.

```json
{"statusCode":400,"error":"Bad Request","message":["from must be a UUID","to must be a UUID"],"path":"/api/trips/search","timestamp":"…"}
{"statusCode":404,"error":"Not Found","message":"Trip not found","path":"/api/trips/{bogus-uuid}","timestamp":"…"}
{"statusCode":401,"error":"UnauthorizedException","message":"Unauthorized","path":"/api/discount-codes","timestamp":"…"}
```

## Tariff Classes

`GET /api/tariff-classes` → two active classes:

| Name | accountingCode | basePrice |
|------|----------------|-----------|
| Basic | `TICKET_BASIC` | 0.00 |
| Flex | `TICKET_FLEX` | 50.00 |

Basic id `f9fdfc15-0fd6-41e3-8018-d2ceaa4bc35d`, Flex id `9c43df02-4dc9-4c2c-aef4-e78a40294868`. The concrete fee schedule is per-trip on `prices[].flexibilityPolicy` (see below), not here.

## Fare Calendar

`GET /api/trips/fare-calendar?from={id}&to={id}&dateFrom=2027-03-20&dateTo=2027-03-26&adults=1`

Lowest price per day. Each day is `available` (with `lowestPrice`) or `no_service` (`lowestPrice: null`) — the 1791 runs only selected days.

```json
{"dateFrom":"2027-03-20","dateTo":"2027-03-26","days":[
  {"date":"2027-03-24","status":"available","lowestPrice":{"amount":103,"currency":"EUR"}},
  {"date":"2027-03-25","status":"no_service","lowestPrice":null}]}
```

## Trip Search

`GET /api/trips/search?from={id}&to={id}&date=2027-03-28&adults=1&limit=10`

Direct trips with per-tariff prices, availability and full stop list. Empty `results[]` = no service that day.

```json
{"passengers":{"adults":1,"children":[],"childrenWithoutSeat":0},
 "results":[{"tripId":"d5d022c5-…","trainNumber":"1791","date":"2027-03-28","status":"bookable",
   "departure":{"station":{"id":"0526883c-…","names":{"de":"Hamburg Hbf",…},"codes":{"plc":"DE 14393","uic":"8002549"}},"time":"2027-03-28T21:22:42","platform":"8"},
   "arrival":{"station":{"id":"2039076a-…","names":{"de":"München Hbf",…}},"time":"2027-03-29T08:14:00","platform":"12"},
   "durationMinutes":651,
   "intermediateStops":[{"station":{"names":{"de":"Bremen Hbf"}},"arrival":"…22:28:30","departure":"…22:30:54","platform":"9","allowsBoarding":true,"allowsAlighting":false},
                        {"station":{"names":{"de":"Augsburg Hbf"}},…,"allowsBoarding":false,"allowsAlighting":true}],
   "prices":[{"tariffClassId":"f9fdfc15-…","tariffClassName":"Basic","amount":66,"currency":"EUR","priceType":"estimate",
     "priceBreakdown":{"adultUnitPrice":66,"childUnitPrice":49.5,"infantUnitPrice":0,…},
     "flexibilityPolicy":{"rebooking":{"rules":[…]},"cancellation":{"rules":[…]}}}],
   "availability":{"total":78,"available":73,"status":"available"},
   "configVersionId":"78e23dd8-…"}]}
```

- **Boarding/alighting rules**: an intermediate stop carries `allowsBoarding` / `allowsAlighting`. On the 1791, Bremen allows boarding only, Augsburg alighting only.
- **Child fare** = 75 % of adult (`childUnitPrice` = adult × 0.75). Infants free.
- **Passenger params**: `adults`, `children`, `childrenWithoutSeat`. `childrenWithoutSeat` maps to `infants` in `priceBreakdown` (free, no seat); the echoed `passengers.children[]` holds child ages.
- **`priceType: "estimate"`** — must be locked via `prepare` before booking.
- **`availability`**: `total` seats, `available` remaining (78 total on the 1791).

### Flexibility policy (fee tiers)

`flexibilityPolicy.rebooking` / `.cancellation` are tiered by hours before departure; the highest matching `minHoursBeforeDeparture` applies.

| minHoursBeforeDeparture | Basic fee % | Flex fee % |
|-------------------------|-------------|------------|
| 720 (30 d) | 10 | — |
| 168 (7 d) | 25 | — |
| 24 | 50 | — |
| 3 | 75 | 0 |
| 0 | 100 | 100 |

Flex is free to rebook/cancel until 3 h before departure, then 100 %. Basic ramps 10→100 %.

## Prepare (price lock + ancillaries)

`POST /api/trips/{tripId}/prepare`

```json
{"tariffClassId":"9c43df02-…","passengers":{"adults":1,"children":0},"quotedTicketTotal":116,"ancillarySelections":[]}
```

Multi-passenger with child ages:

```json
{"tariffClassId":"f9fdfc15-…","passengers":{"adults":2,"children":2,"childAges":[0,5]},"quotedTicketTotal":187,"ancillarySelections":[]}
```

`childAges[]` is the discriminator: **age 0 → infant** (free, no seat), **age ≥1 → child** (75 %). So `children:2, childAges:[0,5]` prices as `children:1, infants:1` in `priceBreakdown`. (The bare `search`/`fare-calendar` use `childrenWithoutSeat` for infants instead.)

Returns a signed **`priceToken`** (JWT) and `priceLockExpiresAt` (~10 min), plus `tariffClasses[]` (locked prices), `availableAncillaries[]`, `selectedAncillaries[]`, `pricing` and `validationErrors[]`. Re-call on each ancillary change. The `priceToken` is required by `POST /bookings`.

`prepare` is lenient: it ignores `quotedTicketTotal` and even an unknown `tariffClassId` (still returns the full `tariffClasses[]` and a token). Price-drift and tariff validation happen at `POST /bookings` against the token, not here. Discount-code validation requires `code` (non-empty string) + `email` (valid email); `orderTotal` is optional.

```json
{"priceToken":"eyJ…","priceLockExpiresAt":"2026-09-23T09:34:25Z","pricedAsOf":"…",
 "tariffClasses":[…],"availableAncillaries":[…],"selectedAncillaries":[],
 "pricing":{"ticketTotal":116,"ancillaryTotal":0,"total":116},"validationErrors":[]}
```

### Ancillaries (from `availableAncillaries[]`)

| code | serviceId | Price | Category | Notes |
|------|-----------|-------|----------|-------|
| `SPECIAL ASSISTANCE` (Easy-Access Seat) | `855843f3-…` | 0 € | comfort | Only 3 per train; `capacityLimit: 3` |
| `DIRECTION_SELECTION` (seat direction) | `ba968ba3-…` | 5 € | comfort | Needs `metadata.passengerSelections` |
| `OVERSIZED_LUGGAGE` (Sperrgepäck) | `24f2500b-…` | 9 € | luggage | `capacityLimit: 8`; >65×40×35 cm |

- `quantityMode: per_passenger`, `maxQuantity: 1`, `availableAt: ["pre_trip"]`.
- **Seat direction** needs a passenger assignment, else `validationErrors[]` returns `DIRECTION_REQUIRES_PASSENGER_ASSIGNMENT`:
  ```json
  {"serviceId":"ba968ba3-…","quantity":1,"metadata":{"passengerSelections":[{"passengerIndex":null,"direction":"forward"}]}}
  ```
  `directionAvailability`: `{forward, backward}` remaining seats.

## Create Booking

`POST /api/bookings`

```json
{"tripId":"d8cfdfbb-…","tariffClassId":"f9fdfc15-…",
 "passengers":[
   {"type":"adult","firstName":"Max","lastName":"Mustermann","email":"max@example.com"},
   {"type":"adult","firstName":"Erika","lastName":"Mustermann"},
   {"type":"child","firstName":"Jimmy","lastName":"Mustermann","age":0},
   {"type":"child","firstName":"Kira","lastName":"Mustermann","age":5}],
 "contactEmail":"max@example.com","contactPhone":"+4915012345678","contactLanguage":"de",
 "quotedTicketTotal":187,"priceToken":"eyJ…","ancillaryServices":[],
 "boardingStationId":"e2af102e-…","alightingStationId":"c9acb25b-…"}
```

- `priceToken` from `prepare` is mandatory (replayed for server-side price validation).
- Passengers: `type` `adult`|`child`, `firstName`/`lastName`, `age` on children (age 0 → priced as infant, free). Only the **contact** passenger needs `email`; the others may omit it.
- `boardingStationId` must be a stop with `allowsBoarding: true`; `alightingStationId` with `allowsAlighting: true`. Verified working intermediate→intermediate (Augsburg→Bremen on the northbound 1790).
- `ancillaryServices` is typically **empty here** — add-ons are attached after creation via `POST /bookings/{id}/ancillaries` (see below).

Response — reservation with a ~30-min hold:

```json
{"bookingId":"12fb52af-…","bookingReference":"KNRHQT","orderId":"658a3418-…","status":"reserved",
 "trip":{"tripId":"d8cfdfbb-…","trainNumber":"1790","date":"2027-03-26"},
 "tariffClassName":"Basic","passengers":[{"id":"…","type":"child",…,"assignedSeat":null}, …],
 "pricing":{"totalAmount":187,"currency":"EUR","priceType":"estimate",
   "priceBreakdown":{"items":[
     {"label":"Adults","quantity":2,"unitAmountGross":68,"unitAmountNet":61.82,"unitAmountVat":6.18,"totalGross":136,"vatRate":0.1},
     {"label":"Children","quantity":1,"unitAmountGross":51,…},
     {"label":"Infants","quantity":1,"unitAmountGross":0,…}],
     "subtotalTickets":{"gross":187,"net":170,"vat":17},"total":{"gross":187,"net":170,"vat":17},"vatRate":0.1}},
 "expiresAt":"2026-09-23T10:04:34Z"}
```

- `bookingReference` is a human 6-char code (`2C0IQU`, `KNRHQT`).
- Per-category line items (`Adults` / `Children` / `Infants`) with gross/net/VAT; VAT **10 %** (`vatRate: 0.1`).
- Passengers are echoed back (order not preserved); each gets its own `id`, `assignedSeat: null` until allocation.
- `status`: `reserved → initiated → paid` (or `cancelled` / `expired`).

## Add Ancillaries (post-booking)

`POST /api/bookings/{bookingId}/ancillaries` — one call per add-on, attached to an existing reservation. **Request key is `product_id`** (not `serviceId` as in `prepare`).

```json
{"product_id":"ba968ba3-…","quantity":1,"metadata":{"passengerSelections":[{"passengerIndex":0,"direction":"forward"}]}}
```

Response confirms the add-on and returns the running booking total:

```json
{"bookingId":"12fb52af-…","orderId":"658a3418-…","included":false,
 "ancillary":{"serviceId":"ba968ba3-…","code":"DIRECTION_SELECTION","quantity":1,"unitAmount":5,"totalAmount":5,"currency":"EUR","paymentStatus":"paid"},
 "bookingTotalAmount":192}
```

- `product_id` = the ancillary `serviceId`. Seat direction still needs `metadata.passengerSelections` (with a concrete `passengerIndex`, e.g. `0`).
- `bookingTotalAmount` accumulates across calls (verified 187 → 192 (+5 direction) → 201 (+9 luggage)).
- `ancillary.paymentStatus: "paid"` even before `/pay` runs — the add-on is folded into the pending order total, settled together at payment.

## Payment

`POST /api/bookings/{bookingId}/pay`  body `{"paymentMethod":"sumup"}`

```json
{"orderId":"658a3418-…","bookingId":"12fb52af-…","status":"initiated",
 "paymentToken":"ORD-658a3418-…","redirectUrl":"","checkoutId":"ed1b957c-…"}
```

The `checkoutId` drives SumUp's hosted card widget (`js.sumup.com/api/checkouts/{checkoutId}`, `gateway.sumup.com/gateway/ecom/card/v2/…`). Card data is entered on SumUp, never on this API. `redirectUrl` is empty for the embedded SumUp flow.

## Discount Codes

`POST /api/discount-codes/validate`  body `{"code":"12345DS","email":"max@example.com","orderTotal":66}`

Invalid code:
```json
{"valid":false,"errorCode":"CODE_INVALID","message":"The code is not valid."}
```

A valid code presumably returns the resolved discount (not observed in the trace).

## Booking Flow

1. `autocomplete` → resolve `from`/`to` municipality ids
2. `fare-calendar` → cheapest per day (calendar strip)
3. `search` (per date) → `tripId`, `prices[]` (estimate), `availability`, stop list
4. `prepare` (tripId + tariffClassId + `ancillarySelections`) → live `priceToken` (~10-min lock), resolved ancillary prices + `validationErrors[]`. Used for the quote/preview; the selection is NOT what gets booked.
5. `bookings` (with `priceToken`, passengers, boarding/alighting stations; `ancillaryServices` usually empty) → `bookingReference`, `status: reserved`, ~30-min `expiresAt`
6. `bookings/{id}/ancillaries` (one call per add-on, `product_id`) → attaches each add-on, running `bookingTotalAmount`
7. `bookings/{id}/pay` (`sumup`) → `checkoutId` → SumUp hosted widget completes payment (tickets + ancillaries settled together)
8. optional: `discount-codes/validate` before booking

## Notes

- No auth anywhere; `api.noxmobility.com` is public and CORS-enabled.
- Currency is EUR only; VAT 10 %.
- Prices are `estimate` until locked by `prepare`; the booking then validates against the `priceToken`.
- Only the running example (1791 Hamburg↔München) was traced; other NOX routes should use the same shapes.
- No credentials or card data are stored in this repo.
