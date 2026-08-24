# Snälltåget API

REST-API für Buchung und Preisabfrage der Snälltåget-Nachtzüge Berlin/Hamburg ↔ Stockholm.

## Base URL

```
https://apiv2.snalltaget.se
```

## Auth

Anonymous Bearer token — no account needed:

1. `GET https://www.snalltaget.se/token/v2` → `access_token` (900s TTL)
2. Use as `Authorization: Bearer <token>`
3. Refresh: `POST /auth/refreshtoken` → new token (1800s TTL)
4. User-Agent header required (Cloudflare blocks generic UA)

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/orientation/calendar` | POST | Price calendar (cheapest per day) |
| `/orientation/searchjourney` | POST | Full journey search with routes/bundles |
| `/orientation/searchservices` | POST | Service details, amenities, travel advisories |
| `/tablebooking/availabletimes` | POST | Available Krogen restaurant time slots |
| `/tablebooking/booktemporary` | POST | Create temporary table reservation |
| `/tablebooking/temporary/{id}` | DELETE | Cancel temporary table reservation |
| `/interrail/validate` | POST | Validate Interrail pass numbers |
| `/booking` | POST | Create a booking (returns PNR) |
| `/booking/{pnr}/cancel` | POST | Cancel a booking (returns 204) |
| `/auth/refreshtoken` | POST | Refresh Bearer token |

## Station Codes

| Station | Search value | EVA (booking) |
|---------|-------------|---------------|
| Berlin | `Berlin` | 800010100 |
| Hamburg | `Hamburg` | — |
| Dresden | `Dresden` | — |
| Malmö | — | 740000003 |
| Stockholm | `740000001` | 740000001 |

## Train Numbers and Routing

| Train | Type | Route | Notes |
|-------|------|-------|-------|
| D 10300 | STNIGHT | Berlin/Hamburg → Stockholm | Direct (1 leg) |
| D 300 | STNIGHT | Berlin/Hamburg → Malmö | Night section only |
| D 30 | STTRAIN | Malmö → Oslo | Day train (since Jun 2026) |
| 3940 | STTRAIN | Malmö → Stockholm | Day continuation |
| 306 | STTRAIN | Hamburg → Stockholm | Day train |
| D 10301 | STNIGHT | Stockholm → Berlin/Hamburg | Return direction |

**D 300 and D 10300 are the same physical train.** The system splits them at Malmö:
- Wagen 214, 215 (Liegewagen) run only Berlin→Malmö → sold under D 300
- Wagen 216–218 run through to Stockholm → sold under D 10300

## Shared Berth Discovery (Aug 2026)

**Shared berths (NTB*) are only offered on the transfer route (D 300 + 3940), never on D 10300 direct.**

This means:
- Direct search Berlin→Stockholm: only Seat (SP*) and Private Compartment (NTPC*)
- Transfer search (same train!): additionally Shared Berth (NTB*)

Prices observed (NTBSF): 1.048–1.998 SEK (historically was 399–499 SEK).

This is likely a revenue optimization: identical Bvcmz 248 6-berth compartments are sold either as:
- Shared Berth (per person, only on D 300 leg) — currently 1.048+ SEK
- Private Compartment (whole compartment) — 1.999–8.499 SEK

## Product Families

| Code | Name | Available on |
|------|------|-------------|
| SPNF | Seat (non-flex) | Direct + Transfer |
| SPSF | Seat (semi-flex) | Direct + Transfer |
| SPFF | Seat (full-flex) | Direct + Transfer |
| SPPCNF/SF/FF | Private Compartment Seats | Hamburg day train |
| NTPCSF | Private Compartment (semi-flex) | Direct + Transfer |
| NTPCFF | Private Compartment (full-flex) | Direct + Transfer |
| NTPCCNF/SF/FF | Private Compartment Comfort | Rare |
| **NTBNF** | **Berth shared (non-flex)** | **Transfer only** |
| **NTBSF** | **Berth shared (semi-flex)** | **Transfer only** |
| **NTBFF** | **Berth shared (full-flex)** | **Transfer only** |
| FCSNF/SF/FF | First Class Seat | Hamburg routes |
| FCSCNF/SF/FF | First Class Seat in Compartment | Hamburg routes |
| FCPCNF/SF/FF | First Class Private Compartment | Hamburg routes |
| NTPCE | Extra Passenger Private Comp | Add-on |
| PET | Travel with a pet | Add-on |

## Comfort Zones

| Code | Meaning |
|------|---------|
| NRR | Non-refundable, non-rebookable |
| REBOOK | Rebookable |
| REFUND | Fully refundable |

## Calendar Response Fields

```json
{
  "amount": 499.0,    // cheapest price (SEK) for that day
  "capacity": 34,     // total remaining places
  "quota": 17         // seats at current price tier
}
```

## Direct Train Filter

Routes with `legs.length == 1` are direct. Filter these for the scraper (non-stop services).

## Wagenmaterial (Vagonweb, confirmed May/Jun 2026)

D 300/10300 formation Berlin→Malmö:
- ELOC Vectron 193
- Wg 213: Bmpz (Sitzwagen, 74 Pl.) — only to Malmö
- Wg 214: Bvcmz 248 (Liegewagen, 40–60 Pl.) — only to Malmö
- Wg 215: Bvcmz 248 (Liegewagen, 40–60 Pl.) — only to Malmö
- Wg 216: Bmpz (Sitzwagen, 74 Pl.) — through to Stockholm
- Wg 217: Bvcmz 248 (Liegewagen, 40–60 Pl.) — through to Stockholm
- Wg 218: Bvcmz 248 (Liegewagen, 40–60 Pl.) — through to Stockholm

Total: 4 Liegewagen + 2 Sitzwagen, ~240 Liegeplätze + 148 Sitzplätze.

## Booking Endpoint

Uses EVA numbers (not search strings). Tariff codes: `NMR_NTBRF` (shared berth),
`SPRBNT` (seat rebookable night train), `SPPCRB_1` (private compartment seat rebookable).

## Option Items (Booking Add-ons)

| Code | Name | Price | Available on |
|------|------|-------|-------------|
| TAB | Take-Away Breakfast | 99 SEK | Night trains (D 300, D 10300) |
| VTAB | Vegan Take-Away Breakfast | 99 SEK | Night trains (D 300, D 10300) |
| BIK1 | Breakfast in Krogen Day 1 | 99 SEK | Day trains with KROG (D 30, 3940) |
| VBIK1 | Vegan Breakfast in Krogen Day 1 | 99 SEK | Day trains with KROG (D 30, 3940) |

Krogen breakfast requires table reservation via `/tablebooking/availabletimes` + `/tablebooking/booktemporary`.

## Service Properties

| Code | Description | Trains |
|------|-------------|--------|
| KIOSK | Kiosk (snack sales) | D 300, D 10300 (night) |
| KROG | Speisewagen (restaurant car) | D 30, 3940, 306 (day) |

Queried via `/orientation/searchservices`. Also returns `travelInfo` with current
travel advisories (construction diversions, temporary halt changes).
