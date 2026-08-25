# RDC EuroNight API

GraphQL-API für den RDC EuroNight Berlin–Hamburg–Stockholm (EN 344/345). Betrieben von BTE/SJ.

## Endpoint

```
POST https://tickets.rdc-deutschland.de/booking
Content-Type: application/json
```

## Required Headers

| Header | Value |
|--------|-------|
| `NEX-Language` | `de` (or `en`, `sv`) |
| `Origin` | `https://www.nachtexpress.de` |
| `Referer` | `https://www.nachtexpress.de/` |
| `x-booking-url` | `https://www.nachtexpress.de/de/buchen/` |

No auth needed. Introspection disabled — queries must be known.

## Key Queries

| Operation | Purpose |
|-----------|---------|
| `Init` | Initialize session, get available routes |
| `ReadDepartureStations` | List departure stations for a direction |
| `ReadArrivalStations` | List arrival stations given departure |
| `ReadTrainConnections` | Available trains for date/route |
| `ReadTimeSchedule` | Full timetable with stops and times |
| `ReadEntityTypes` | Accommodation types + availability |
| `ReadPriceCategories` | Prices per entity type and category |

## Station IDs

| ID | Station |
|----|---------|
| 68 | Berlin Lichtenberg |
| 67 | Berlin Gesundbrunnen |
| 5 | Hamburg Altona |
| 69 | Hamburg Hbf |
| 57 | Stockholm Central |
| 58 | Malmö Central |
| 59 | Lund |
| 60 | Hässleholm |
| 61 | Alvesta |
| 62 | Nässjö |
| 63 | Mjölby |
| 64 | Linköping |
| 65 | Norrköping |
| 66 | Södertälje |

## Entity Types (Accommodation)

| Type | HashID | Description | Compartment |
|------|--------|-------------|-------------|
| Sitz | `Z5RRRzb1J4` | Seat (2nd class, Bimz 264) | up to 6 pers (comp) or open |
| Liege | `BKVpAEyGbm` | Couchette (6-berth, Bvcmz 248) | 6 berths, lockable |
| Bett | `mkkJKnMnWm` | Sleeper 2nd (WLABmz AB32) | 2-berth, washbasin |
| Bett 1.Klasse | `mdoeXD6Lj4` | Sleeper 1st (WLABmz Deluxe) | 3-berth, shower+WC |

## IsCabinBooking

- `false` = single place (shared compartment)
- `true` = private compartment (entire cabin)

## Price Categories

| ID | Name | Note |
|----|------|------|
| 35 | Normal | Standard full-flex price |
| 34 | Spar | Discounted, limited availability |
| 36 | Interrail | Reservation supplement for pass holders |

## Batching

Multiple `EntityRequests` can be sent in a single `ReadPriceCategories` call — one per accommodation type. Avoids N+1 requests.

## Traffic Days

### EN 344 (Berlin/Hamburg → Stockholm)
- **Mo + Fr**: from Berlin Lichtenberg
- **Mi**: from Hamburg only (no Berlin departure)

### EN 345 (Stockholm → Berlin/Hamburg)
- **Do + Sa**: to Berlin Lichtenberg
- **Di**: to Hamburg only (no Berlin arrival)

## Train Formation (Vagonweb, 02.09.–12.12.2026)

Sources:
- [EN 344](https://www.vagonweb.cz/razeni/vlak.php?zeme=BTE&kategorie=EN&cislo=344&nazev=RDC+EuroNight&rok=2026)
- [EN 345](https://www.vagonweb.cz/razeni/vlak.php?zeme=BTE&kategorie=EN&cislo=345&nazev=RDC+EuroNight&rok=2026)

| Wg | Owner | Type | Category | Capacity | Notes |
|----|-------|------|----------|----------|-------|
| — | RPOOL | 193 | Electric loco (Vectron) | — | |
| 21 | RAG | Bvcmz 248.5 | Couchette | 60 berths | as required |
| 22 | RAG | Bvcmz 248.5 | Couchette | 60 berths | as required |
| 23 | RAG | Bvcmz 248.5 | Couchette | 60 berths | Comp. 11 = pets |
| 24 | BTEX | Bvcmbz 249.1 | Couchette + accessible | 32–48 berths | Comp. 2+9 staff, 3+10 logistics |
| 25 | RAG | WLABmz AB32 | Sleeper 1st+2nd | 2–6 + 13–26 beds | Comp. 1 pets, seats 71–76 Deluxe |
| 26 | RAG | WLABmz AB32 | Sleeper 1st+2nd | 2–6 + 13–26 beds | Seats 71–76 Deluxe |
| 27 | RAG | WLABmz AB32 | Sleeper 1st+2nd | 2–6 + 13–26 beds | Seats 71–76 Deluxe |
| 28 | RAG | WLABmz AB32 | Sleeper 1st+2nd | 2–6 + 13–26 beds | Seats 71–76 Deluxe, as required |
| 31 | RAG | Bimz 264 | Seated 2nd | 25 (comp.) + 35 (open) = 60 | Comp. 111–115 pets |
| 32 | RAG | Bimz 264 | Seated 2nd | 60 | as required |
| 33 | RAG | Bimz 264 | Seated 2nd | 60 | as required |

### Capacity Summary

| API entity | Type | Fixed coaches | Capacity (fixed) | + as required | Max |
|-----------|------|--------------|-----------------|---------------|-----|
| Sitz | Bimz 264 | 1 (Wg 31) | 60 | +120 (Wg 32, 33) | 180 |
| Liege | Bvcmz 248.5 / 249.1 | 2 (Wg 23, 24) | ~96 | +120 (Wg 21, 22) | 228 |
| Bett | WLABmz AB32 (2nd class) | 3 (Wg 25–27) | 78 | +26 (Wg 28) | 104 |
| Bett 1.Kl | WLABmz AB32 (Deluxe) | 3 (Wg 25–27) | 18 | +6 (Wg 28) | 24 |

WLABmz AB32 layout per car: 13 standard compartments (2-berth, washbasin) + 2 Deluxe compartments (2–3 berth, shower+toilet).

### Price Tiers (Berlin→Stockholm, Normalpreis)

| Entity | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|--------|--------|--------|--------|--------|
| Sitz | 60€ | 80€ | — | — |
| Liege Single | 120€ | 150€ | 170€ | 200€ |
| Liege Cabin | 360€ | 430€ | 470€ | 500€ |
| Bett Single | 200€ | 250€ | 300€ | — |
| Bett Cabin | 300€ | 375€ | 450€ | — |
| Bett 1.Kl Cabin | 420€ | 495€ | 525€ | 600€ |

Spar = 85% of Normal, Interrail = 80% of Normal.

## Capacity Probing via AmountAdults

The API reveals remaining capacity through `ReadPriceCategories`: if `AmountAdults` exceeds available inventory, the response returns an empty `PriceCategories[]`.

### Semantics of AmountAdults

| Booking type | AmountAdults means | Price field |
|---|---|---|
| Single (`IsCabinBooking: false`) | Number of individual berths/seats | `Price = SinglePrice × n` |
| Cabin (`IsCabinBooking: true`) | Number of compartments | `Price = flat rate per cabin` (constant regardless of occupants) |

### Tier Boundaries Visible in Multi-Person Requests

When requesting multiple Single places, the price jumps to the next tier once the current tier's contingent is exceeded. The jump applies to **all** places in the request (not just the additional ones):

```
Liege Single, n=3: Price=450, SinglePrice=150  → 3×150 (all within Tier 2)
Liege Single, n=4: Price=680, SinglePrice=170  → 4×170 (Tier 3 applies to all)
Bett Single,  n=1: Price=250, SinglePrice=250  → 1×250 (Tier 2)
Bett Single,  n=2: Price=600, SinglePrice=300  → 2×300 (Tier 3 applies to all)
```

This reveals tier boundaries: Liege has 3 places at Tier 2 (150€), then jumps. Bett has 1 place at Tier 2 (250€), then jumps. `SinglePrice` always equals `Price / AmountAdults`.

### Observed Capacity (Berlin→Stockholm, first 3 connections, fresh season)

| Type | Capacity | Unit | Notes |
|------|----------|------|-------|
| Sitz Single | 5 | seats | vs. 60 physical (Wg 31) |
| Liege Single | 6 | berths | vs. 96+ physical |
| Liege Cabin | 6 | compartments (×6 = 36 berths) | vs. 16+ physical compartments |
| Bett Single | 2 | berths | vs. 78 physical |
| Bett Cabin | 2 | compartments (×2 = 4 berths) | vs. 39+ physical compartments |
| Bett 1.Kl | 3 | compartments (×3 = 9 berths) | vs. 6-8 physical Deluxe compartments |

These are **per-booking caps** (max places per single request), identical across all 29 connections and all routes (Berlin, Hamburg, intermediate stations). They do NOT reflect remaining inventory.

However, **price tiers within the cap reveal actual occupancy**. Example (Sitz):
- Low-demand date (11.09): all 5 at 60€ (Tier 1)
- High-demand date (04.09): 2 at 80€ (Tier 2), then jumps to 100€ (Tier 3)

The tier at which prices start, and where they jump, indicates how many cheap places have been sold across ALL channels (including former SJ sales).

### Per-Booking Rules

- `AmountAdults + AmountChildren` count together toward the capacity limit
- `AmountBaby` does NOT count (babies have no seat)
- The UI enforces the same limits (max 5 persons for Sitz, max 6 for Liege)
- Single and Cabin have **separate contingents** for the same wagon type (e.g., Liege Single=6 + Liege Cabin=6 independently)

### Method

Binary search via AmountAdults: double until empty, then bisect. ~8 requests per entity type to find exact boundary.

```python
def find_capacity(conn_hash, entity_hash, is_cabin):
    low, high = 1, 1
    while has_prices(conn_hash, entity_hash, is_cabin, high):
        low = high
        high *= 2
    while low < high - 1:
        mid = (low + high) // 2
        if has_prices(conn_hash, entity_hash, is_cabin, mid):
            low = mid
        else:
            high = mid
    return low
```

## Example: ReadTrainConnections

```json
{
  "operationName": "ReadTrainConnections",
  "variables": {
    "DepartureStationID": 68,
    "ArrivalStationID": 57,
    "VehiclesEnabled": false
  },
  "query": "query ReadTrainConnections($DepartureStationID: Int!, $ArrivalStationID: Int!, $VehiclesEnabled: Boolean!) { readTrainConnections(DepartureStationID: $DepartureStationID, ArrivalStationID: $ArrivalStationID, VehiclesEnabled: $VehiclesEnabled) { HashID StartDate DepartureNextDay UnreliableTimeSchedule } }"
}
```

Response returns all bookable connections (no date filter — returns entire season).

## Example: ReadEntityTypes

```json
{
  "operationName": "ReadEntityTypes",
  "variables": {
    "TrainConnectionHashID": "Z5ELrvXvnJ"
  },
  "query": "query ReadEntityTypes($TrainConnectionHashID: ID!) { readEntityTypes(TrainConnectionHashID: $TrainConnectionHashID) { ID Title Icon InfoPreview BookingOptions { Code Title } } }"
}
```

## Example: ReadPriceCategories

```json
{
  "operationName": "ReadPriceCategories",
  "variables": {
    "input": {
      "ArrivalStationID": 57,
      "ConsiderExpiryDate": true,
      "DepartureStationID": 68,
      "EntityRequests": [{
        "AddOns": [],
        "AmountAdults": 1,
        "AmountBaby": 0,
        "AmountChildren": 0,
        "AmountSeniors": 0,
        "AmountStudents": 0,
        "CollectionTag": null,
        "ExpectedPrice": null,
        "IsCabinBooking": false,
        "Passes": [],
        "PriceCategory": null,
        "RequestID": "uuid-v4",
        "Type": "BKVpAEyGbm"
      }],
      "EntityTypeHashIDs": ["BKVpAEyGbm"],
      "TrainConnectionHashID": "Z5ELrvXvnJ",
      "Vehicles": []
    }
  },
  "query": "query ReadPriceCategories($input: PriceCategoryInput!) { readPriceCategories(input: $input) { RequestID PriceCategories { ID Title SubTitle Price { Amount Currency } SinglePrice { Amount Currency } } } }"
}
```


## Open Questions

1. **5 seats vs 60 physical** — RDC sells only 5 Sitz online (8% of Wg 31 capacity). Is the rest sold via other channels, or held back entirely? Same pattern for all types (Liege 6/96, Bett 2/78).

2. **SJ involvement post-September** — SJ sells EN 344 until 31.08.2026 (confirmed via sj.se, `producer: "SJ_ONLY"`, `serviceType: "SJEURO"`). From 01.09 no results on sj.se → SJ drops out entirely. nachtexpress.de becomes sole online channel. Will contingents increase at that point?

3. **Other sales channels** — Are tickets available via Reisebüros or bahn.de after September? Or is nachtexpress.de the only point of sale?

4. **Contingent dynamics** — Do the observed limits (5/6/2/3) change over the season? Need time series data post-September to confirm.
