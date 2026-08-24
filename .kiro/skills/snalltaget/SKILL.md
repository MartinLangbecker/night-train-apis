# Snälltåget API

REST-API für Buchung und Preisabfrage der Snälltåget-Nachtzüge Berlin/Hamburg ↔ Stockholm.

## Base URL

```
https://apiv2.snalltaget.se
```

## Auth

Anonymous Bearer token — no account needed:

1. Call any endpoint without token → 401 response includes a fresh token in body
2. Use token as `Authorization: Bearer <token>`
3. Refresh before expiry: `POST /auth/refreshtoken` with current token

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/orientation/calendar` | POST | Price calendar (cheapest per day) |
| `/orientation/searchjourney` | POST | Full journey search with routes/bundles |
| `/orientation/searchservices` | POST | Detailed service items for a bundle |
| `/auth/refreshtoken` | POST | Refresh Bearer token |

## Station Codes

| Station | Code |
|---------|------|
| Berlin | `Berlin` |
| Hamburg | `Hamburg` |
| Dresden | `Dresden` |
| Stockholm | `740000001` |
| Malmö | `740000003` |
| Norrköping | `740000007` |
| Linköping | `740000008` |

## Direction Logic

- **Outbound** (`direction: "outbound"`): origin ∈ {Berlin, Hamburg, Dresden}
- **Homebound** (`direction: "homebound"`): origin = Stockholm/Swedish station

## Calendar Response Fields

```json
{
  "amount": 499,       // cheapest price in SEK for that day
  "capacity": 12,      // total remaining places across all product families
  "quota": 3           // seats available at the current (cheapest) price tier
}
```

- `amount = 0` → sold out
- `capacity` = sum of all product family remaining seats
- `quota` = how many can still be booked at `amount` price before tier increases

## Product Families (productFamilyId)

| ID | Description |
|----|-------------|
| `SPNF` | Seat (non-flex) |
| `SPSF` | Seat (semi-flex) |
| `SPFF` | Seat (full-flex) |
| `NTPCFF` | Couchette full-flex |
| `NTPCSF` | Couchette semi-flex |

## Comfort Zones (comfortZones)

| Code | Meaning |
|------|---------|
| `NRR` | Non-refundable, non-rebookable |
| `REBOOK` | Rebookable (fee applies) |
| `REFUND` | Fully refundable |

## Direct Train Filter

Search results contain `routes[]` with `legs[]`. Direct connections have `legs.length == 1`. Filter out multi-leg routes to get non-stop services only.

## Cloudflare Protection

All requests require a realistic `User-Agent` header (e.g. Chrome/Edge UA string). Requests without it or with generic UA (like `python-requests`) get blocked by Cloudflare.

## Train Numbers

- **D 10300**: Berlin/Hamburg → Stockholm (southbound → northbound)
- **D 10301**: Stockholm → Berlin/Hamburg
