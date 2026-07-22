# European Sleeper API

## Base URL
`https://europeansleeperprod-api.azurewebsites.net/api`

## Key Endpoints
- `GET /constants` — full config: stations, routes, pricing, limits (no auth needed)
- `POST /search/trains` — find trains for date/route
- `POST /search/availability` — pricing/seat availability (needs trainRouteId from search)
- `POST /booking/upsert` — create/update booking
- `GET /booking/get-authenticated/{bookingId}` — booking status/details
- `POST /booking/start-checkout` — initiate payment (Pay.nl)
- `GET /booking/status` — payment status
- `POST /booking/cancel-trip` — cancel before payment
- `POST /booking/cancel-unpaid-booking` — cancel after payment initiated but not completed

## Routes

| Route | ID | Train | Active from | Accommodation |
|-------|----|-------|-------------|---------------|
| Brussels–Prague | `77ab1c5a-ea0b-4634-7cdd-08db0daabe3f` | 453/454 | always | couchette-5, berth, comfort |
| Brussels–Milan | `c4c37ac1-a9dc-4ffa-a9ec-1acd0a8c9c16` | 401 | 2026-09-09 | couchette-4, couchette-6, berth, comfort |
| Paris–Berlin | `c181e609-05b7-456a-bab6-4203dc2c3402` | 474/475 | 2026-03-26 | couchette-5, berth, comfort |

### Brussels–Prague (train 453/454)
Bruxelles Midi → Antwerpen → Roosendaal → (Breda*) → Rotterdam → Den Haag → Amsterdam → Amersfoort → Deventer → Berlin Hbf → Berlin Ost → Dresden → Bad Schandau → Děčín → Ústí nad Labem → Praha hl.n.

### Brussels–Milan (train 401, from Sep 9, 2026)
Bruxelles Midi → Liège → (NL stations from Dec 13*) → Aachen → Köln → Aarau → Zürich HB → Göschenen → Arth-Goldau → Bellinzona → Lugano → Chiasso → Como san Giovanni → Milano Porta Garibaldi

### Paris–Berlin (train 474/475, from Mar 26, 2026)
Paris-Nord → Aulnoye-Aymeries → Mons → Bruxelles Midi → Liège → Hamburg-Harburg → Berlin Ostbahnhof → Berlin Hbf

*Stations with `mappedStationId`: bookable but train doesn't stop there. Passengers transfer independently (e.g. Breda → boards at Roosendaal).

## Station Mapping vs Detours

| Mechanism | Source | Example | Dynamic? |
|-----------|--------|---------|----------|
| **Static mapping** | `mappedStationId` in /constants | Breda → Roosendaal | Permanent |
| **Dynamic detour** | `detourInfo` in search/booking | Berlin Ost → Gesundbrunnen | Construction |

Detour stations (e.g. 8010102 Berlin-Gesundbrunnen, 8700012 Paris-Est) are not in constants and cannot be used as search input.

## Passenger Types
- 72 = Adult
- 73 = Child (4-11)
- 44 = Interrail/Eurail (reservation only)

## Tariff Codes (in booking response)
- 65 = Adult (standard)
- 72 = Adult (legacy?)
- 73 = Child
- 44 = Interrail/Eurail

## Interrail Availability
- Brussels–Prague: ✅ (seat 21€, couchette-5 74€, berth-triple 109€, comfort-triple 99€)
- Brussels–Milan: ✅ (seat 21€, couchette-6 52€, comfort-triple 99€)
- Paris–Berlin: ✅ (seat 21€, couchette-5 74€, private 269€)

## Domestic Journeys
Disabled for: NL (84), BE (88), CZ (54), FR (87), CH (85), IT (83)

## Multi-Currency
Prices in: EUR, CZK, GBP, JPY, USD
Currency codes (for checkout): 1=EUR, 2=CZK, 3=GBP, 4=JPY, 5=USD

### Fixed Exchange Rates
ES uses fixed rates (like Leo Express). Derived from ticket prices:
- CZK/EUR ≈ 24.9 (market ~25.3 → CZK is ~2% more expensive)
- GBP/EUR ≈ 0.88 (market ~0.84 → **GBP is ~5% cheaper**)
- JPY/EUR ≈ 191.7 (market ~162 → JPY is ~18% more expensive)
- USD/EUR ≈ 1.18 (market ~1.08 → USD is ~9% more expensive)

Recommendation: pay in GBP if possible.

## Booking States
- 0 = pending (reservation created, modifiable)
- 1 = checkout initiated (Pay.nl URL generated, cancel-trip no longer works)
- 4 = finalized (paid, or auto-expired after checkout was initiated)

## Booking Flow
1. `POST /search/trains` → find train (trainNumber, travelDate)
2. `POST /search/availability` → get accommodation types + prices
3. `POST /booking/upsert?lang=en-GB` → create reservation (assigns seats, 30-min expiry timer)
4. `POST /booking/start-checkout?lang=en-GB&currency=1&bookingId={id}` → returns `{"checkoutUrl": "https://checkout.pay.nl/to/order/{uuid}"}`
5. User redirected to Pay.nl for payment
6. `GET /booking/status?bookingId={id}&paymentId={uuid}` → poll for `isPaid: true`
7. Booking state transitions: 0 → 1 (after checkout) → 4 (after payment/expiry)

### Cancellation
- `cancel-trip`: works in state 0 only (before checkout)
- `cancel-unpaid-booking`: works in state 1 (after checkout initiated, before payment)
- No auth required — just needs the booking UUID

### No Auth
All booking endpoints are unauthenticated. Knowing the booking UUID grants full access (read, modify, cancel). UUIDs are unguessable (v4).

## Accommodation Types by Route

**Prague route:** seat-second-class, couchette-5, couchette-5-women-only, couchette-5-private, berth-single/double/triple, comfort-single/double/triple

**Milan route:** seat-second-class, couchette-4, couchette-4-women-only, couchette-6, couchette-6-private, berth-single/double/triple, comfort-single/double/triple

**Paris–Berlin route:** (same as Prague, TBC)

## Add-ons
- Breakfast: 14€ (34900 CZK cents)
- Pets: 29.99€ (74700 CZK cents), max 2 per trip, private compartments only
- Bicycle: seasonal (summer periods), max 5

## Settings
- `maxReservationDate`: 2027-03-18
- `maxPassengerAmount`: 5
- `maxTripsPerBooking`: 4
- `bookingFlowState`: 2 (meaning unknown; 2 = normal operation)

## Search Request
Both camelCase and PascalCase field names accepted:
```json
{
  "fromLocationId": "8800104",
  "toLocationId": "5457076",
  "departureDate": "2026-09-15T00:00:00.000Z",
  "passengerTypes": [72],
  "bicycleCount": 0,
  "petsCount": 0,
  "returnDate": null
}
```

## Feature Flags
GrowthBook (`cdn.growthbook.io/api/features/sdk-f3H1TOHQ3mZ5BUOo`):
- `fare-selection`: A/B test at 50/50 (fare type selection UI variant)

## Deep Links
Booking UI supports URL parameters:
```
https://booking.europeansleeper.eu/en?departureStation={EVA}&arrivalStation={EVA}&departureDate={YYYY-MM-DD}&bicycleCount=0&petsCount=0&passengerTypes=72&passengerTypes=73
```
