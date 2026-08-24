# Snälltåget API

REST-API für Buchung und Preisabfrage aller Snälltåget-Züge (Schweden, Norwegen, Dänemark, Deutschland, Österreich).

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
| `/navigation/stops` | GET | All 99 stations with codes, synonyms |
| `/fare/passengertypes` | GET | Passenger types (AD, CH, YTH, ST, SR) |

## Route Network

### Year-round services

| Train | Type | Route | Frequency |
|-------|------|-------|-----------|
| 3940/3941 | STTRAIN | Stockholm ↔ Malmö ↔ Copenhagen | daily |
| 306/307 | STTRAIN | Stockholm ↔ Malmö ↔ Copenhagen ↔ Hamburg | daily (since 04.05.2026) |
| D 30/31 | STTRAIN | Malmö ↔ Göteborg ↔ Oslo | quasi-daily (since 15.06.2026) |

### Seasonal night trains

| Train | Type | Route | Season |
|-------|------|-------|--------|
| D 10300/10301 | STNIGHT | Berlin/Hamburg ↔ Stockholm (direct) | ~Apr–Dec, Mo–Fr+So |
| D 300/301 | STNIGHT | Berlin/Hamburg ↔ Malmö (night section) | same as D 10300 |
| 304/305 | STNIGHT | Malmö ↔ Copenhagen ↔ Hamburg ↔ Austria | Winter (Dec–Mar), Summer (Jul), Fr |
| 24/25 | STNIGHT | Malmö ↔ Åre (Sommer-Nachtzug) | Aug–Sep, ~2x/Woche |
| 3900/3901 | STNIGHT | Malmö ↔ Storlien (via Östküste) | Winter, variable Tage |
| 3902/3903 | STNIGHT | Malmö ↔ Storlien (via Westküste) | Winter, variable Tage |
| 3904/3905 | STNIGHT | Malmö ↔ Åre/Duved (Sitzwagen-Sektion) | Winter Fr/Sa |
| 13904/13905 | STNIGHT | Malmö ↔ Vemdalen-Röjan (Liegewagen-Sektion) | Winter Fr/Sa (Hin+Rück-Pflicht) |
| 3908/3909 | STTRAIN | Malmö ↔ Stockholm ↔ Mora (+bus Sälen) | Winter (Dec–Apr), Sa |

### D 300/10300 — Nachtzug Berlin ↔ Stockholm

Same physical train, split in the system at Malmö:
- **D 300**: Berlin/Hamburg → Malmö (night section, Wg 213–215 end here)
- **D 10300**: Berlin/Hamburg → Stockholm (through service, Wg 216–218)

Stops: Berlin Hbf → (Dresden) → Hamburg Hbf → Malmö C → (Stockholm C)

### D 30/31 — Tageszug Malmö ↔ Oslo

| Station | Dep (→Oslo) | Dep (→Malmö) | EVA |
|---------|-------------|--------------|-----|
| Malmö C | 06:38 | 21:25 arr | 740000003 |
| Lund C | 06:48 | — | 740000120 |
| Helsingborg C | 07:14 | — | 740000044 |
| Halmstad C | 07:55 | — | 740000080 |
| Varberg | 08:29 | — | 740000110 |
| Göteborg-Mölndal | 09:08 | — | — |
| Göteborg-Gamlestaden | 09:16 | — | — |
| Trollhättan | 09:46 | — | 740000191 |
| Sarpsborg | 11:55 | — | 760000527 |
| Fredrikstad | 12:10 | — | 760000522 |
| Oslo S | 13:16 arr | 14:48 | 760000100 |

Norwegian stops (Sarpsborg, Fredrikstad) bookable as destination only, not as boarding point.
Products: Sitz (299–399 SEK), Private Compartment Seats (1.316–2.256 SEK).

### 24/25 — Sommer-Nachtzug Malmö ↔ Åre

| Direction | Train | Dep | Arr |
|-----------|-------|-----|-----|
| → Åre | 24 | Malmö 16:35 | Åre 07:35+1 |
| → Malmö | 25 | Åre 16:40 | Malmö 07:15+1 |

Season: Aug–Sep, ~2x/Woche (Mi+Sa). Stops via Östküste (Hässleholm, Alvesta, Nässjö, Linköping, Norrköping, Stockholm, Uppsala, Östersund).

Products: **All** — Sitz (499 SEK), NTB (874 SEK), Private Comp (3.499 SEK), First Class Seat (874 SEK), First Class Private Comp (3.846 SEK).

### 3900–3903 — Winter-Nachtzüge Malmö ↔ Storlien

Two routing variants, variable operating days (matched to changeover days):

**Via Östküste (3900/3901):** Malmö → Lund → Hässleholm → Alvesta → Nässjö → Linköping → Norrköping → Stockholm → Uppsala → Östersund → Undersåker → Åre → Duved → Enafors → Storlien

**Via Westküste (3902/3903):** Malmö → Lund → Helsingborg → Halmstad → Göteborg-Mölndal → Stockholm → Uppsala → Östersund → Undersåker → Åre → Duved → Enafors → Storlien

| Train | Route | Dep | Arr | Days |
|-------|-------|-----|-----|------|
| 3900 | Malmö → Storlien (Öst) | 16:35 | ~08:55+1 | Sa, Mi (Dec–Apr) |
| 3901 | Storlien → Malmö (Öst) | — | — | So, Do |
| 3902 | Malmö → Storlien (West) | 15:20 | ~06:05+1 | Mi, Sa selected |
| 3903 | Storlien → Malmö (West) | 16:40 | 08:45+1 | Mo, Do, So selected |

Products: Sitz (499–999 SEK), Private Compartment (2.999–6.499 SEK). No NTB on these.

Transfers available from Östersund to Vemdalen/Funäsfjällen ski areas on selected dates.

### 3904/13904 + 3905/13905 — Vemdalen Ski Trains (Winter Fr/Sa)

Same physical train departing Malmö 15:25 (Fridays), split into two sections:

| Train | Destination | Products | Notes |
|-------|-------------|----------|-------|
| 3904 | Åre (07:35) → Duved (07:55) | Sitz only (699+ SEK) | Sitzwagen-Sektion |
| 13904 | Vemdalen-Röjan (08:10) | NTB only (1.249+ SEK) | Liegewagen-Sektion |
| 3905 | Duved (dep) → Malmö | Sitz only | Return Saturdays |
| 13905 | Vemdalen-Röjan (16:00) → Malmö (08:45+1) | NTB only (999+ SEK) | Return Saturdays |

**Booking restriction:** Berth/Private only available as return trip (Fri out + Sat back).
No service properties (no KROG, no BAG) on 13904/13905.

Season: Fridays 18.12.2026–12.02.2027 and 12.03–02.04.2027.

### 306/307 — Tageszug Stockholm ↔ Hamburg

| Station | Dep (→Hamburg) |
|---------|----------------|
| Stockholm C | 10:43 |
| Södertälje Syd | 11:01 |
| Norrköping C | 12:10 |
| Linköping C | 12:35 |
| Nässjö C | 13:32 |
| Alvesta | 14:10 |
| Hässleholm C | 14:55 |
| Eslöv | 15:17 |
| Lund C | 15:30 |
| Malmö C | 15:41 |
| København Syd | ~16:xx |
| Odense | — |
| Kolding | — |
| Padborg | — |
| Neumünster | — |
| Hamburg Hbf | — |

### 304/305 — Nachtzug Malmö ↔ Österreich

Stops: Stockholm C* → Malmö C → Høje Taastrup → Odense → Kolding → Hamburg Hbf → St. Johann im Pongau → Zell am See

*Stockholm via connecting day train (Alvesta, Nässjö, Linköping, Norrköping, Södertälje).

Bus connections from Zell am See to: Obertauern, Wagrain, Bad Gastein, Saalbach-Hinterglemm, Zell am Ziller, Mayrhofen, Sölden, Obergurgl, Ischgl, St. Anton.

Season 2026/27: Fri departures 18.12.2026–14.03.2027 (winter), Jul 2026 (summer).

## Station Codes

99 stations total (via `/navigation/stops`). Key stations:

| Station | Search value | EVA | Country |
|---------|-------------|-----|---------|
| Berlin Hbf | `Berlin` | 800010100 | DE |
| Hamburg Hbf | `Hamburg` | 800020400 | DE |
| Dresden Hbf | `Dresden` | — | DE |
| München Ost | — | 800080603 | DE |
| Neumünster | — | 800024643 | DE |
| Kopenhagen | `Köpenhamn` | — | DK |
| Odense | — | 860000512 | DK |
| Kolding | — | 860000083 | DK |
| Padborg | — | 860000100 | DK |
| Malmö C | `Malmö C` | 740000003 | SE |
| Stockholm C | `740000001` | 740000001 | SE |
| Göteborg | `Göteborg` | — | SE |
| Mora | — | 740000302 | SE |
| Åre | — | 740000115 | SE |
| Oslo S | `760000100` | 760000100 | NO |
| Zell am See | — | 810000320 | AT |
| Salzburg Hbf | — | 810000462 | AT |
| Innsbruck Hbf | — | 810000522 | AT |

## Shared Berth Discovery (Aug 2026)

**Shared berths (NTB*) are NOT offered on D 10300 direct Berlin→Stockholm.**

NTB availability across the network:

| Route | NTB available? | Notes |
|-------|---------------|-------|
| D 10300 (Berlin→Stockholm direct) | ❌ | API rejects: "Tariff conditions broken" |
| D 300 (Berlin→Malmö transfer) | ✓ | 749–1.998 SEK |
| D 300+3940 bundle (Berlin→Stockholm) | ✓ | 1.048–1.998 SEK |
| 13904/13905 (Vemdalen) | ✓ | NTB ONLY, no other products |
| 24/25 (Sommer Åre) | ✓ | 874–973 SEK |
| 3900–3903 (Winter Åre) | ❌ | Only Seat + Private |

Separate search Berlin→Malmö yields NTB at lower price (749) than the bundle (1.048).
Marketing pages for Berlin→Stockholm advertise only Seat + Private Compartment.
Oslo page explicitly lists all three options for the Berlin→Malmö leg.

## Product Families

| Code | Name | Available on |
|------|------|-------------|
| SPNF/SF/FF | Seat | All routes |
| SPPCNF/SF/FF | Private Compartment Seats | Day trains (306, 3940, D 30) |
| NTPCSF/FF | Private Compartment (night) | Night trains |
| NTPCCNF/SF/FF | Private Compartment Comfort | Rare (Austria?) |
| **NTBNF/SF/FF** | **Berth shared** | **D 300, 13904/13905, Zug 24/25** |
| FCSNF/SF/FF | First Class Seat | 306 + Zug 24/25 (Sommer-Nachtzug) |
| FCSCNF/SF/FF | First Class Seat in Compartment | 306 |
| FCPCNF/SF/FF | First Class Private Compartment | 306 + Zug 24/25 |
| NTPCE | Extra Passenger Private Comp | Add-on |
| PET | Travel with a pet | Add-on |

## Booking

Uses EVA numbers (not search strings).

Tariff codes:
- `NMR_NTBRF` — Shared berth (rebookable/flex)
- `SPRBNT` — Seat rebookable night train
- `SPPCRB_1` — Private compartment seat rebookable

## Option Items (Booking Add-ons)

| Code | Name | Price | Where |
|------|------|-------|-------|
| TAB | Take-Away Breakfast | 99 SEK | Night trains (KIOSK segment) |
| VTAB | Vegan Take-Away Breakfast | 99 SEK | Night trains (KIOSK segment) |
| BIK1 | Breakfast in Krogen Day 1 | 99 SEK | Day trains with KROG |
| VBIK1 | Vegan Breakfast in Krogen Day 1 | 99 SEK | Day trains with KROG |

Krogen breakfast requires table reservation: `/tablebooking/availabletimes` → `/tablebooking/booktemporary`.

## Service Properties

Returned by `/orientation/searchservices`:

| Code | Description | Trains |
|------|-------------|--------|
| KIOSK | Kiosk (snack sales) | D 300, D 10300 (night) |
| KROG | Speisewagen (restaurant car) | D 30, 3940, 306, 3900 (day + ski nights) |
| BAG | Baggage check-in available (498 SEK return) | 3900 (ski trains) |
| SKI | Ski check-in possible | 3900 (ski trains) |

Also returns `travelInfo[]` with current construction/diversion advisories or booking restrictions.

## Comfort Zones

| Code | Meaning |
|------|---------|
| NRR | Non-refundable, non-rebookable |
| REBOOK | Rebookable |
| REFUND | Fully refundable |

## Wagenmaterial D 300/10300 (Vagonweb, confirmed 2026)

- ELOC Vectron 193
- Wg 213: Bmpz (Sitzwagen, 74 Pl.) — only to Malmö
- Wg 214: Bvcmz 248 (Liegewagen, 40–60 Pl.) — only to Malmö
- Wg 215: Bvcmz 248 (Liegewagen, 40–60 Pl.) — only to Malmö
- Wg 216: Bmpz (Sitzwagen, 74 Pl.) — through to Stockholm
- Wg 217: Bvcmz 248 (Liegewagen, 40–60 Pl.) — through to Stockholm
- Wg 218: Bvcmz 248 (Liegewagen, 40–60 Pl.) — through to Stockholm

## Passenger Types

| Code | Name | Age |
|------|------|-----|
| AD | Adult | — |
| CH | Child | 0–15 |
| YTH | Youth | 16–25 |
| ST | Student | 16–99 |
| SR | Senior | 60+ |

## Calendar Response

```json
{
  "amount": 499.0,    // cheapest price (SEK)
  "capacity": 34,     // total remaining places
  "quota": 17         // seats at current price tier
}
```

## Scraper Notes

- Routes with `legs.length == 1` = direct
- Routes with `legs.length == 2` = transfer (D 300 + 3940 or D 300 + D 30)
- D 300 departure from Hamburg-Harburg (800020400) during construction
- serviceIdentifier format: `0:RDA|{trainNr}|{STNIGHT|STTRAIN}|{date}|{dep}|{arr}`
