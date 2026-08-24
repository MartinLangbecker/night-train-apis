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
| `Origin` | `https://tickets.rdc-deutschland.de` |
| `Referer` | `https://tickets.rdc-deutschland.de/` |
| `x-booking-url` | `https://tickets.rdc-deutschland.de` |

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

| Type | HashId | Description |
|------|--------|-------------|
| Sitz | `8a21db97-3b0a-483a-9c5a-459fc4e6a590` | Seat (2nd class) |
| Liege | `a1c7e3d4-5f8b-4e2a-b6d9-8c3f1a2e7b54` | Couchette (6-berth) |
| Bett | `c4e8f2a1-7d3b-4c6e-9a5f-2b8d1e4c7a39` | Berth (3-berth compartment) |
| Bett 1.Klasse | `f7b3d9e2-1a4c-4d8f-b5e6-3c9a2f7d1e84` | Berth 1st class (1–2 berth) |

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

## Example: ReadTrainConnections

```json
{
  "operationName": "ReadTrainConnections",
  "variables": {
    "DepartureStationId": 68,
    "ArrivalStationId": 57,
    "Date": "2026-09-05"
  },
  "query": "query ReadTrainConnections($DepartureStationId: Int!, $ArrivalStationId: Int!, $Date: String!) { readTrainConnections(departureStationId: $DepartureStationId, arrivalStationId: $ArrivalStationId, date: $Date) { TrainConnectionId DepartureDateTime ArrivalDateTime TrainNumber } }"
}
```

## Example: ReadEntityTypes

```json
{
  "operationName": "ReadEntityTypes",
  "variables": {
    "TrainConnectionId": 123,
    "DepartureStationId": 68,
    "ArrivalStationId": 57
  },
  "query": "query ReadEntityTypes($TrainConnectionId: Int!, $DepartureStationId: Int!, $ArrivalStationId: Int!) { readEntityTypes(trainConnectionId: $TrainConnectionId, departureStationId: $DepartureStationId, arrivalStationId: $ArrivalStationId) { EntityTypeId Name HashId IsCabinBooking BookingOptions { BookingOptionId Name } } }"
}
```
