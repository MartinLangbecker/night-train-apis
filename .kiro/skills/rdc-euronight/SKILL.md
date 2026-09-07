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
| 5 | Hamburg Hbf |
| 57 | Stockholm Central |
| 58 | Norrköping Central |
| 59 | Linköping Central |
| 60 | Nässjö Central |
| 61 | Alvesta |
| 62 | Hässleholm |
| 64 | Lund C |
| 65 | Københavns Lufthavn |
| 66 | Padborg |
| 70 | Mölndals nedre |

### Route Restrictions

Not all station pairs are bookable:

| Route | Bookable? | Notes |
|-------|-----------|-------|
| Berlin/Hamburg → Stockholm | ✓ | Main routes |
| Berlin/Hamburg → Swedish intermediates | ✓ | Malmö, Linköping, Norrköping etc. |
| Berlin/Hamburg → Padborg | ✓ | Shortest segment from Germany (Sitz 72€ vs 80€ to Stockholm) |
| Padborg → Stockholm | ✓ | 43 connections |
| Berlin → Hamburg | ✗ | Domestic Germany blocked |
| Malmö → Stockholm | ✗ | Domestic Sweden blocked |
| Malmö/Lund/Hässleholm/Alvesta/Nässjö → Linköping/Stockholm | ✗ | Short Swedish segments blocked |
| Malmö–Nässjö → Norrköping | ✓ | Norrköping is the minimum Swedish destination from south |

66 of 156 station pairs are bookable (42%). General rule: cross-border segments work, domestic segments are blocked. Exception: Norrköping appears to be a boundary — bookable from southern Swedish stations, but Linköping/Stockholm are not.

Prices are distance-independent for Liege/Bett (same price Berlin→Padborg as Berlin→Stockholm). Only Sitz has distance-based pricing (72€ to Padborg vs 80€ to Stockholm on same date).

### Pricing: Route-Independent (zugweit)

Tier prices are identical regardless of departure station (Berlin or Hamburg) on the same train. One contingent per train, not per routing.

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
Season: 01.09.–12.12.2026

| Day | From Berlin? | Route variant |
|-----|---|---|
| **Mo** | ✓ (18:39, 19:06 until 05.10) | Standard (east coast) |
| **Mi** | ✗ (Hamburg only, 21:53) | Standard (east coast) |
| **Fr** | ✓ (18:39, 19:06 until 05.10) | Standard (east coast) |
| **Fr special** (11.9, 23.10, 20.11) | ✓ (18:39) | Via **Mölndals nedre (Göteborg)**, skips Hässleholm–Norrköping |

Fr 06.11 does not operate. Mi 23.09 departs Berlin at 19:06.

Standard timetable (east coast):
```
Berlin Lichtenberg  dep 18:39 (19:06 until 05.10)
Hamburg Hbf         dep 21:53
Padborg             dep 00:29
København Airport   arr 03:23
Lund                arr 04:35
Hässleholm          arr 05:13
Alvesta             arr 06:01
Nässjö              arr 06:45
Linköping           arr 07:48
Norrköping          arr 08:16
Stockholm Central   arr 09:45
```

Göteborg variant (special Fridays):
```
...same until Lund 04:35...
Mölndals nedre (Gbg) arr 07:30
Stockholm Central    arr 11:10
```

### EN 345 (Stockholm → Berlin/Hamburg)
Season: 01.09.–12.12.2026

| Day | To Berlin? | Route variant |
|-----|---|---|
| **Di** | ✗ (Hamburg only) | Standard (east coast) |
| **Do** | ✓ (Berlin Gesundbrunnen) | Standard (east coast) |
| **Sa** | ✓ (Berlin Gesundbrunnen) | Standard (east coast) |
| **Sa special** (12.9, 26.9, 10.10, 24.10, 21.11, 5.12) | ✓ | Via **Mölndals nedre (Göteborg)**, skips Norrköping–Hässleholm |

Sa 07.11 does not operate. Di 22.09 runs to Berlin Gesundbrunnen (exception).

Standard timetable (east coast):
```
Stockholm Central   dep 17:29
Norrköping          dep 18:59
Linköping           dep 19:29
Nässjö              dep 20:29
Alvesta             dep 21:10
Hässleholm          dep 21:57
Lund                dep 22:31
København Airport   dep 23:52
Padborg             arr 03:12
Hamburg Hbf         arr 05:53
Berlin Gesundbrunnen arr 08:56
```

Göteborg variant (special Saturdays):
```
Stockholm Central   dep 17:10
Mölndals nedre (Gbg) dep 22:10
Lund                dep 00:43
København Airport   dep 01:37
Padborg             arr 05:08
Hamburg Hbf         arr 08:10
Berlin Gesundbrunnen arr 11:10
```

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

### Price Tiers (Normalpreis)

| Entity | T1 | T2 | T3 | T4 | T5 | T6 |
|--------|-----|-----|-----|-----|-----|-----|
| Sitz Single | 40€ | 54€ | 60€ | 72€ | 80€ | 90€ |
| Liege Single | 100€ | 120€ | 150€ | 170€ | 200€ | — |
| Liege Cabin | 300€ | 360€ | 430€ | 470€ | 500€ | — |
| Bett Single | 200€ | 250€ | 300€ | — | — | — |
| Bett Cabin | 300€ | 375€ | 450€ | — | — | — |
| Bett 1.Kl Cabin | 420€ | 495€ | 525€ | 600€ | — | — |

Tier count varies by entity: Sitz has 6 tiers, Liege Single/Cabin 5 tiers, Bett 1.Kl 4 tiers, Bett 3 tiers. The lowest Liege tiers (100€ Single, 300€ Cabin) appear rarely — only on a few low-demand dates.

### Price Category Multipliers

| Category | Multiplier | Applies to |
|----------|-----------|------------|
| Normalpreis | 1.00× | All entity types |
| Sparpreis | 0.85× (85% of Normal) | All except Bett 1. Klasse |
| Interrail | 0.80× (80% of Normal) | All entity types |

Bett 1. Klasse has no Sparpreis — only Normalpreis and Interrail are offered.

### Tier Dynamics

- Prices are **route-independent** (zugweit): same tier prices for Berlin and Hamburg departures on the same train. One contingent per train, not per routing.
- Prices can **move backwards** (tier downgrades). Cancellations or contingent releases restore places to lower tiers, causing observed prices to decrease between snapshots.
- Tier progression over time: T1 (plenty) → T1 (jump visible, few remain) → T2 (plenty) → … → highest tier → sold out.

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
- Low-demand date (11.09): all 5 at 40€ (Tier 1)
- High-demand date (04.09): 2 at 72€ (Tier 4), then jumps to 80€ (Tier 5)

The tier at which prices start, and where they jump, indicates how many cheap places have been sold across ALL channels (including former SJ sales).

### Tier Scan Interpretation

Two possible outcomes per entity per date:

1. **Tier jump within cap** → exact number of remaining places in current tier known
   - Example: Liege `[150 150 150 150 170 170]` → 4 places left in Tier 2
2. **No jump** → current tier has ≥cap places remaining (i.e. ≥5 for Sitz, ≥6 for Liege)
   - Example: Liege `[120 120 120 120 120 120]` → Tier 1, at least 6 remain

No multi-tier jumps observed within a single scan (max 1 boundary per entity per date). Tier sizes are ≥6 places.

Over time, a date progresses: Tier 1 (no jump) → Tier 1 (jump visible, few remain) → Tier 2 (no jump) → Tier 2 (jump visible) → ... → highest tier → sold out.

### Per-Booking Rules

- `AmountAdults + AmountChildren` count together toward the capacity limit
- `AmountBaby` does NOT count (babies have no seat)
- The UI enforces the same limits (max 5 persons for Sitz, max 6 for Liege)
- Single and Cabin have **separate contingents** for the same wagon type (e.g., Liege Single=6 + Liege Cabin=6 independently)

### Method: Sequential Tier Scan

Per entity type, request prices for n=1 through n=cap (Sitz=5, Liege=6, Bett=2, Bett 1.Kl=3). Every n is probed — no approximation needed given the small caps. Multiple entity types are batched in one API call.

Optimized flow:
1. Request n=1 (baseline) and n=cap simultaneously for each entity
2. If prices match → no tier jump, capacity ≥ cap (plenty of availability)
3. If prices differ → full sequential scan n=2..cap-1 to locate exact jump point
4. `tier_jump_at` = first n where `SinglePrice` changes; `capacity = tier_jump_at - 1`

```python
# Simplified — actual implementation batches all entity types per request
def scan_entity(conn_hash, entity_hash, is_cabin, cap):
    p1 = get_price(conn_hash, entity_hash, is_cabin, 1)
    pN = get_price(conn_hash, entity_hash, is_cabin, cap)
    if p1 == pN:
        return {"tier_jump_at": None, "capacity": "≥" + str(cap)}
    for n in range(2, cap + 1):
        pn = get_price(conn_hash, entity_hash, is_cabin, n)
        if pn != p1:
            return {"tier_jump_at": n, "capacity": n - 1, "next_tier_price": pn}
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
