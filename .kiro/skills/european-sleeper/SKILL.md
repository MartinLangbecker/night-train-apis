# European Sleeper API

## Base URL
`https://europeansleeperprod-api.azurewebsites.net/api`

## Key Endpoints
- `GET /constants` — full config: stations, routes, pricing, limits (no auth needed)
- `POST /search/trains` — find trains for date/route
- `POST /search/availability` — pricing/seat availability (needs trainRouteId from search)
- `POST /booking/upsert` — create/update booking

## Routes (from /constants)
- Brussels–Prague (via Antwerp, NL, Berlin, Dresden) — route `77ab1c5a...`
- Brussels–Milan (via Liège/Antwerp, Cologne, Switzerland) — route `c4c37ac1...`
- Paris–Berlin (via Mons, Brussels, Liège, Cologne) — route `c181e609...`

## Passenger Types
- 72 = Adult
- 73 = Child (4-11)
- 44 = Interrail/Eurail (reservation only)

## Domestic Journeys
Disabled for: NL (84), BE (88), CZ (54), FR (87), CH (85), IT (83)

## Multi-Currency
Prices returned in: EUR, CZK, GBP, JPY, USD
