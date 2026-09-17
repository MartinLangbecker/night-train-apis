# ZPCG (Montenegro Railways) API

Reverse-engineered API of [Zeljeznicki prevoz Crne Gore](https://www.zpcg.me) (ZPCG), the Montenegrin passenger rail operator. The Montenegro-side counterpart to Serbia's srbvoz.rs eKarta on the shared Belgrade to Bar line. Reverse-engineered from `www.zpcg.me` (timetable/price) and `tickets-zpcg.me` (booking).

## Base URLs

```
https://api.zpcg.me            # public REST (timetable, pricing) - no auth, CORS-enabled
https://tickets-zpcg.me        # booking front end (proxy, quote, Monri payment)
```

## Auth

None. `api.zpcg.me` is a public, CORS-enabled REST API (OPTIONS preflight, no token/cookie). The booking host proxies it server-side to avoid CORS in checkout.

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `api.zpcg.me/api/stops` | GET | All stops (~75) |
| `api.zpcg.me/api/routes?start=&finish=&date=` | GET | Direct connection search (names, not IDs) |
| `api.zpcg.me/api/routes/cumulative?type=` | GET | Full O/D matrix (~1 MB) |
| `api.zpcg.me/api/stop/prices/{stopId}` | GET | Fare matrix from a stop |
| `api.zpcg.me/api/route/prices/{routeId}` | GET | Beds + concessions for a route |
| `tickets-zpcg.me/api-proxy.php?action=routes\|stop-prices` | GET | Booking-side mirror of the REST search |
| `tickets-zpcg.me/purchase-api.php` | POST | Price a cart (quote) |

HTML pages (not API): `tickets-zpcg.me/en/rezultati.php?from=&to=&date=` (results), `/en/checkout.php?tid=&from=&to=&date=` (checkout).

## Cross-system station link

Every stop carries `external_country_id` (**62 = Montenegro, 72 = Serbia**) and `external_stop_id`, which is the code the Serbian srbvoz.rs system uses as `sifra`. So the two APIs share station identity:

| Station | ZPCG StopID | external_stop_id / Srbija Voz sifra | country |
|---------|-------------|-------------------------------------|---------|
| Bar | 1 | 31080 | ME (62) |
| Podgorica | 8 | 31001 | ME (62) |
| Bijelo Polje | 22 | 31302 | ME (62) |
| Kolasin | 15 | 31307 | ME (62) |
| Beograd Centar | 31 | 16050 | RS (72) |

Foreign (Serbian) through-stops of the 432/433 appear in `/api/stops` with `local: 0` and `external_country_id: 72`.

## Stops

`GET /api/stops` returns ~75 stops:

```json
{"StopID":1,"Name_me":"Bar","Name_en":"Bar","Name_me_cyr":"Бар","StopTypeID":4,
 "Latitude":42.087639,"Longitude":19.105217,"local":1,
 "external_country_id":62,"external_stop_id":31080,
 "stop_type":{"StopTypeID":4,"Name_me":"glavna stanica","Name_en":"main station"}}
```

- `StopTypeID`: 1 = stanica (station), 2 = stajaliste (halt), 3 = ukrsnica (crossing), 4 = glavna stanica (main station)
- `local`: 1 = ZPCG network, 0 = foreign through-stop
- Names in `Name_me` (Montenegrin Latin), `Name_en`, `Name_me_cyr` (Cyrillic)

## Search

```
GET /api/routes?start=Bar&finish=Podgorica&date=2026-09-20
```

- `start`/`finish` are station **names** (`Name_en`/`Name_me`, Cyrillic also works), not IDs
- `date`: `YYYY-MM-DD` (consistent across all endpoints, unlike Srbija Voz)
- Direct trains only (`connected` is present but empty)

Edge cases (verified): unknown station name -> HTTP 404 (HTML); `start == finish` -> `{"price":null,"direct":[],"connected":[]}`; missing `date` -> defaults to today; malformed date -> `price` kept, `direct[]` empty; foreign (Serbian, `local:0`) through-stops accepted as endpoints; past dates resolve.

`GET /api/routes/cumulative?type=` returns the whole O/D matrix (~1 MB). `type` filters it: `international` -> only 432/433 (~105 KB), `local` -> only 6xxx/7xxx (~929 KB), `null` or any other value -> full matrix.

Response:

```json
{"price":{"PricelistID":110,"StopFromID":1,"StopToID":8,"Class1Price":4.2,"Class2Price":2.8},
 "direct":[{"TimetableID":171,"RouteID":83,"TrainNumber":"6100","TrainTypeID":3,"International":0,
   "timetable_items":[{"ArrivalTime":null,"DepartureTime":"05:13:15",
     "routestop":{"Order":10,"StopID":1,"stop":{...}}}]}],
 "connected":[]}
```

- `TrainTypeID`: 1 = international, 3 = local. `International`: 0/1.
- `Class1Price`/`Class2Price` = 1st/2nd class base fare in EUR.
- `timetable_items` is the full stop list with per-stop arrival/departure and nested `stop`.

## Trains

| Train | Type | Route | International |
|-------|------|-------|--------------|
| 432 | 1 | Bar to Beograd Centar ("Lovcen", dep Bar 20:10) | 1 |
| 433 | 1 | Beograd Centar to Bar | 1 |
| 6100 | 3 | Bar to Podgorica (local) | 0 |
| 6102 / 6103 | 3 | Bar to/from Bijelo Polje (local) | 0 |
| 6151 | 3 | Virpazar to Bar (local) | 0 |

The 432/433 is the same physical train as Srbija Voz voz 432/433; ZPCG sells the Montenegro side.

## Pricing

**Base fares** are in the search result (`price`) and via `GET /api/stop/prices/{stopId}` (a matrix from one stop to every reachable destination, `Class1Price`/`Class2Price` in EUR). `connected` is always empty.

**Accommodation + concessions**: `GET /api/route/prices/{routeId}` groups items by `PriceGroupID`:

- **Group 3 (Lezajevi / Beds)** carries a numeric `Amount` (EUR). Identical to the reservation fees on the Serbian side of the 432/433:

  | Description | Compartment | EUR |
  |-------------|-------------|-----|
  | Postelja WL Single | 1 person | 48 |
  | Postelja WL Double | 2 person | 24 |
  | Postelja WL Turist | 3 person | 16 |
  | Lezaj Ac | 4 person | 12 |
  | Lezaj Bc | 6 person | 8 |

- **Group 2 (Povlastice / Travel Concessions)** is descriptive only (`Amount: null`):
  - K-15 student/pupil card (3 EUR, valid the school year)
  - K-5 journalist card (5 EUR, valid 2 years), K-5a (1 EUR)
  - EURO<26 / ISIC / ITIC / IYTC / ETC: approx 50 %
  - child under 6: free when accompanied by a fare-paying passenger
  - child 6 to 14: 50 %
  - small dogs: 50 %

  K-15/K-5/K-5a cards are printed and issued by ZPCG itself.

## Purchase (quote)

```
POST tickets-zpcg.me/purchase-api.php
Content-Type: application/json

{"action":"quote",
 "legs":[{"timetableId":172,"fromId":1,"toId":22,"date":"2026-09-17"},
         {"timetableId":121,"fromId":22,"toId":1,"date":"2026-09-24"}],
 "class":2,"adults":1,"children":0,"childAges":[],"resType":"none","berthType":null}
```

- `legs[]`: one per direction. `timetableId` from search, `fromId`/`toId` are `StopID`s, `date` `YYYY-MM-DD`.
- `class`: 1 or 2. `resType` `none` (+`berthType: null`) = plain seat; `resType` `berth` needs a `berthType`.
- `berthType` is a numeric selector (not the `PriceID`), verified live on the 432/433:

  | berthType | Accommodation | Fee EUR | Class |
  |-----------|---------------|---------|-------|
  | 1 | Postelja Single (1 person) | 48 | 1st only |
  | 2 | Postelja Double (2 person) | 24 | 1st or 2nd |
  | 3 | Postelja Tourist (3 person) | 16 | 1st or 2nd |
  | 4 | Kuset AC (4-berth) | 12 | 2nd only |
  | 6 | Kuset BC (6-berth) | 8 | 2nd only |

  `berthType` 0/5 are rejected. Single forces 1st class; Kuset forces 2nd class; Double/Tourist work in either class. Example totals (Beograd to Bar): Double 2nd class 47.80 EUR (23.80 + 24), Tourist 2nd class 39.80 EUR, Kuset BC 31.80 EUR (23.80 + 8), Single 1st class 83.60 EUR (35.60 + 48).
- `?lang=en` switches response labels to English (`Outbound`/`Adults`); default and `Accept-Language` yield Montenegrin (`Odlazak`/`Odrasli`).
- Any action other than `quote` returns HTTP 400 `{"error":"Nepoznata akcija."}`.

**Online-sale suspension (undocumented):** the international night train can be blocked online per train and date, returning `{"error":"Online prodaja za voz <nr> dana <date> je obustavljena, karte se kupuju na šalteru."}` (buy at the counter). The window is direction-specific and rolls forward daily (observed mid-Sep 2026: 432 opened from 22.09, 433 from 24.09). Local 6xxx/7xxx trains are unaffected.

Response (verified, Bar to Bijelo Polje return, 2nd class):

```json
{"class":2,
 "legs":[{"leg":1,"legLabel":"Outbound","trainNumber":"6102","date":"2026-09-17",
          "fromName":"Bar","toName":"Bijelo Polje","dep":"16:35","arr":"19:56"},
         {"leg":2,"legLabel":"Return","trainNumber":"6103","date":"2026-09-24",
          "fromName":"Bijelo Polje","toName":"Bar","dep":"09:09","arr":"12:35"}],
 "items":[{"legLabel":"Outbound","typeLabel":"Adults","qty":1,"unitEur":"7.20","totalEur":"7.20"},
          {"legLabel":"Return","typeLabel":"Adults","qty":1,"unitEur":"7.20","totalEur":"7.20"}],
 "totalEur":"14.40","currency":"EUR"}
```

## Payment

Card payment redirects to the **Monri IPG** gateway (`ipg.monri.com`); card data is entered on the bank page, not on ZPCG. Accepted: Visa, Mastercard, Maestro, Diners, Discover. Only the `quote` action is traced in the HAR; the actual purchase/pay actions are handled through the Monri redirect.

## Notes

- No auth anywhere; `api.zpcg.me` is fully public and CORS-enabled.
- Currency is EUR throughout (Montenegro uses the euro), unlike the dual RSD+EUR of Srbija Voz.
- Dates are `YYYY-MM-DD` on every endpoint.
- `api-proxy.php` exists only to sidestep CORS during checkout; it mirrors the public REST responses.
- No credentials or card data are stored in this repo.
