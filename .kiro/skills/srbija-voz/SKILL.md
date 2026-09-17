# Srbija Voz eKarta API

Reverse-engineered booking API behind the [srbvoz.rs eKarta](https://webapi1.srbvoz.rs/ekarta/app/) web app (AngularJS SPA). Serbian Railways (Srbija Voz) online ticketing for the **whole network** (domestic + international, all train categories). Reverse-engineered via the night train **IR 432/433 "Lovćen" Zemun (Beograd) ↔ Bar** (the running example below), but the endpoints and options apply to every route the system sells.

## Base URL

```
https://webapi1.srbvoz.rs/eKarta/api
```

REST/JSON. Search and pricing are open; reservation and purchase require a logged-in account session.

## Auth

Session-based. `POST /auth/login` returns `{success, username, userId}` and sets two HttpOnly cookies: `auth_token` and `refresh_token`. Subsequent calls reuse them; `POST /auth/refresh` returns `{"success": true}` and rotates them, `POST /auth/ok` is a heartbeat, `POST /auth/logout` ends the session.

```
POST /auth/login
Content-Type: application/json

{"username": "<email>", "password": "<password>", "deviceId": "<uuid>"}
```

Search, pricing and station endpoints are open. Reservation/purchase and the embedded `cenRez`/`eTCVJson` fields require the session. No credentials are stored in this repo — supply your own account.

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Log in, create session |
| `/auth/refresh` | POST | Refresh session (`{"success": true}`) |
| `/auth/ok` | POST | Session heartbeat |
| `/auth/logout` | POST | End session |
| `/stanica/StaniceGetAll_MPS` | GET | All stations |
| `/listavozova` | GET | Timetable validity probe (last valid date) |
| `/listavozova/ListaVozova_Web` | GET | Search connections (incl. embedded `cenRez` + `eTCVJson`) |
| `/TCV/TcvCena` | GET | Detailed tariff calculation |
| `/OrkaRezervacijaPlan/WEB_REZ_MS` | POST | Reserve seat/berth |
| `/OrkaRezervacijaPlan/WEB_StatusZa_RezOrderTMP` | GET | Reservation status (temp order) |
| `/OrkaRezervacijaPlan/WEB_VratiOraRezervacijuMS` | GET | Retrieve/cancel reservation |
| `/karta/post` | POST | Purchase ticket (bank payment redirect) |
| `/user/GetPagedOrders` | GET | Order history (paged): `?ID_USER=&pageNumber=&pageSize=` → `{totalOrders, orders[]}` |
| `/user/korisnik` | GET | User profile: `?iduser=` (returns array; `lozinka` always null) |
| `/zavrsena` | GET | Completed-order lookup: `?oid=` (HTTP 500 for unpaid orders) |
| `/karta/VracanjeMail` | POST | Ticket refund / e-mail (empty body → `"bad google"`, expects reCAPTCHA) |
| `/user/PostUser` | POST | Register / update profile (from SPA, not fully traced) |
| `/user/post_zaboravljenaV2` | POST | Password reset (`{username, lozinka}`, e-mail-verified) |

## Trains

Search returns all categories via `rang`/`rangs`:

| rangs | Category | Notes |
|-------|----------|-------|
| IC | InterCity | Includes SOKO high-speed (`soko: true`), e.g. Beograd–Subotica; reservation required |
| IR | InterRegio | Long-distance, e.g. night train 432/433; reservation varies |
| Re | Regional | `rezervacioni_sistem: false`, no seat reservation |

`rezervacioni_sistem: true` = reservation required/possible (ORKA endpoints). `soko: true` = SOKO high-speed.

Montenegro is served by the night train **432/433 Zemun ↔ Bar** and a seasonal daytime train **1131/1130 Subotica ↔ Bar**. International online sales (Montenegro trains + Subotica ↔ Szeged) launched 21 July 2026; the 5 % web/app discount applies to domestic fares only, not international.

### Example: night train IR 432/433 "Lovćen" (through Montenegro, spectacular Belgrade–Bar line):

| Train | Rang | Route | Dep → Arr | Duration |
|-------|------|-------|-----------|----------|
| 432 | IR | Bar → Zemun (Beograd) | Bar 20:10 → Zemun 07:25 | 11:15 |
| 433 | IR | Zemun (Beograd) → Bar | Zemun 19:35 → Bar 06:54 | 11:19 |

Both run as **IR "Lovćen"**. Beograd Centar-PROKOP is an intermediate stop (train 432 arr 07:08); the train terminates at Zemun (Beograd). Route (432 northbound): Bar → Sutomore → Golubovci → Podgorica → Kolašin → Mojkovac → Bijelo Polje → Brodarevo → Prijepolje → Priboj → Užice → Požega → … → Beograd Centar (Prokop) → Zemun. Border SR↔ME at Bijelo Polje: administration `1062` (ЖПЦГ / ZPCG Montenegro) and `1172` (Srbija Voz).

## Station Codes (`sifra`)

Numeric IDs from `stanica/StaniceGetAll_MPS` (~400 stations, 10 international). `medjunarodna: 1` = international station.

| sifra | Station | Country | medjunarodna |
|-------|---------|---------|--------------|
| 16002 | Zemun (Beograd) — terminus | RS | 0 |
| 16052 | Beograd Centar-PROKOP | RS | 0 |
| 15153 | Užice | RS | 0 |
| 23450 | Subotica | RS | 0 |
| 106231080 | BAR | ME | 1 |
| 106231001 | PODGORICA | ME | 1 |
| 106231302 | Bijelo Polje | ME | 1 |
| 106231307 | Kolašin | ME | 1 |
| 115517228 | SZEGED | HU | 1 |
| 15707 | Štrpci | BA | 0 |

International relations by country: **Montenegro** (Bar/Podgorica, via the night train 432/433 and seasonal 1131/1130), **Hungary** (Szeged, via Subotica ↔ Szeged), **Bosnia-Herzegovina** (Štrpci). Štrpci is a geographic curiosity: the Belgrade–Bar line passes through a short stretch of Republika Srpska (BiH) between Priboj and Prijepolje, and Štrpci sits on it, yet the system lists it as a **domestic** station (`medjunarodna: 0`, sifra 15707), served by regular Regio trains (e.g. 2100/2102/2104 to Zemun/Beograd, 2101/2103/2151 to Prijepolje Teretna). Only Montenegro and Hungary stations carry `medjunarodna: 1`.

Search a station by name (`naziv`) in the full list. `sort_order`: 1 = Beograd, 100 = international, 50 = domestic.

## Connection Search

```
GET /listavozova/ListaVozova_Web?stanicaod=106231080&stanicado=16052&datum=2026-9-17&brojputnika=1&razred=2
```

- `datum`: `YYYY-M-D` (no leading zeros)
- `razred`: 1 or 2 (class)

Only **direct trains** are returned — no transfer itineraries. A pair without a through train yields `[]` (e.g. Niš↔Subotica, Beograd→Zrenjanin, Beograd→Bogojevo — not served). The UI's `via` field is disabled; passing `via` (any value or guessed param name) to the search is accepted but ignored — it does not unlock transfers. Cross-border works where a through train runs (Subotica↔Szeged, voz 7300/7301 Re; Beograd→Niš voz 2901 Re; Bar↔Zemun 432/433 IR).

Key response fields per connection:
- `brvoz` train number, `rangs` type (IR), `vremep`/`vremed` dep/arr, `trajanje_putovanja` duration
- `cenau`/`cenao` price RSD, `vrsta_cene` price type (62 = SET za ZPCG)
- `rezervacioni_sistem: true` = reservation required
- `kusetpostelja: 1` = couchette/sleeper offered, `praceniauto: 1` = car transport
- `mS_SlobodnaMesta` = free places per class
- `etTrasaVoza[]` = full route with per-stop times
- `cenRez[]` = reservation-fee matrix (session only); rows `{TIP, RAZRED, DIN, EUR, REL}` map `TIP`→`TIPU`, `RAZRED`→`TIP_KABINE`, `REL` = M (international) / U (domestic)
- `eTCVJson` = full `TcvCena` payload as a JSON string (session only) — lets a client skip the separate `TCV/TcvCena` call

### Free Places (`mS_SlobodnaMesta`)

Field-to-product mapping verified against the UI:

| Field | Product | Berth position |
|-------|---------|----------------|
| BROJS1 / BROJS2 | Seat 1st / 2nd class | — |
| BROJL1 | Couchette "Kušet AC" (4-berth) | dole / gore |
| BROJL2 | Couchette "Kušet BC" (6-berth) | dole / sredina / gore |
| BROJPT | Sleeper "Postelja Turist" (3-berth) | dole / sredina / gore |
| BROJPD | Sleeper "Postelja Double" | dole / gore |
| BROJSING | Sleeper "Postelja Single" | none (whole compartment) |
| BROJA / BROJB | Accompanied car (auto) | — |

## Pricing

```
GET /TCV/TcvCena?mOD=106231080&mDO=16052&mVrstaCene=62&mSifraPovlastice=0&mDatumPutovanja=28-9-2026&mRazred=1&mSmer=1&mBrojPutnika=1&mBrojDece=0&mGodineDeteta=0
```

- `mDatumPutovanja`: `D-M-YYYY`
- `mVrstaCene`: 62 = SET za ZPCG, 68 = CITY STAR ZPCG. CITY STAR is the official round-trip-to-Montenegro fare (first adult full price, each further companion up to 4 at 20 %, child 6–14 companion at 50 % of the first adult). A single-passenger `mVrstaCene=68` probe returned `TCV_SUM = 0.0`; the fare likely needs ≥2 passengers to price (not verified). The API `Povlastice` list for Bar↔Zemun is `1` (RVC) + `51` (DETE); SRB PLUS / RAIL PLUS / PAS are frontend-only options.
- `mSifraPovlastice`: discount code (1 = full fare RVC, 51 = child 6–14)

Response `CeneTCV[]` gives per-administration segments (KM, `CENA_DINARA`, `CENA_EURO`). Totals in `TCV_SUM_RSD` / `TCV_SUM_EUR` with exchange rate `KURS` (~119.6 RSD/EUR). Cards are always charged in RSD; any EUR figure is informational only (NBS mid rate).

Discount options in the passenger step (official guide): full fare, **SRB PLUS** (card K-13, 30 % on domestic fares one-way and return, personalised card, not honoured for on-board purchase in the SOKO IC), **RAIL PLUS SV** (card K-30, 30 %), entered by legitimation number (auto-fills name + birth date), **DETE** (child 6–14, 50 %; under 6 free unless own seat needed), **PAS** (dog). A return ticket gets a **20 % round-trip discount** (no card needed), but only when the exact train number and date are supplied for both legs (otherwise a 500 RSD surcharge is charged on board). Web/app purchases get an extra **5 %** on domestic fares. Domestic online sale opens 2 months ahead and closes 3 hours before departure.

Ticket validity: one-way tickets are valid 1 day; return tickets ≤100 km valid 1 day, ≥101 km valid 15 days (each leg still 1 day).

## Payment

`karta/post` initiates a **Banca Intesa** card-payment redirect (card data entered on the bank's page, not seen by Srbija Voz). On success the response carries a transaction ID / payment ID / status code, and the ticket PDF is e-mailed to the account address.

Fulfillment (international Montenegro trains 432/433 and 1131/1130): seat tickets/reservations can be shown from the app or as an A4 PDF, but sleeper (postelja), couchette (kušet) and car-transport tickets must be printed on A4 and shown before boarding, otherwise the passenger is treated as travelling without a valid ticket.

Refund (online tickets): cancel via "Otkaži kartu" in the profile up to 24 h before the travel date; Srbija Voz keeps 10 % of the fare and refunds the rest to the original card (e-mail confirmation). Within 24 h it goes via the O-5 reclamation form to `kontrola.prihoda@srbijavoz.rs`. No refund after the journey has started, except on railway fault. Promotional Beograd centar ↔ Novi Sad tickets are non-refundable/non-exchangeable.

## Reservation

```
POST /OrkaRezervacijaPlan/WEB_REZ_MS
Content-Type: application/json
```

`TIPU` = place type, `TIP_KABINE` = sub-class (razred). Live-verified matrix (2nd class, Bar↔Zemun):

| Accommodation | TIPU | TIP_KABINE | Fee |
|---------------|------|-----------|-----|
| Seat | 1 | 2 | 3 € |
| Kušet BC (6-berth) | 2 | 2 | 8 € |
| Kušet AC (4-berth) | 2 | 1 | 12 € |
| Postelja Turist (3-berth) | 3 | 3 | 16 € |
| Postelja Double | 3 | 2 | 24 € |
| Postelja Single | 3 | 1 | 48 € |
| Auto (car) | 4 | 1 | 40 € |

These mirror the `cenRez` matrix in the search result (`TIP`→`TIPU`, `RAZRED`→`TIP_KABINE`).

Seat, window (verified):
```json
{
  "ORDER_IDU": "SVOID31013386",
  "BROJ_VOZAU": 433,
  "DAT_SAOBRACAJAU": "9-29-2026",
  "OD_STANICAU": 16052,
  "DO_STANICAU": 106231080,
  "BROJ_MESTAU": 1,
  "TIPU": 1,
  "TIP_KABINE": 2,
  "POZICIJAU": 3,
  "POLU": "M"
}
```

Sleeper (Postelja Turist, verified):
```json
{
  "ORDER_IDU": "SVOID84841530",
  "BROJ_VOZAU": 433,
  "DAT_SAOBRACAJAU": "9-29-2026",
  "OD_STANICAU": 16052,
  "DO_STANICAU": 106231080,
  "BROJ_MESTAU": 1,
  "TIPU": 3,
  "TIP_KABINE": 3,
  "POZICIJAU": 1,
  "POLU": "M"
}
```

- `DAT_SAOBRACAJAU`: `M-D-YYYY`
- `POZICIJAU`: requested position (all UI-verified). No middle option for berths, and 1/3 are swapped between couchette and sleeper:
  - Seat (TIPU 1): 0 = Svejedno (any), 1 = Sredina, 2 = Hodnik (aisle), 3 = Prozor (window)
  - Ležaj / couchette (TIPU 2): 0 = Svejedno, 1 = Gore (upper), 3 = Dole (lower). Kušet BC (6-berth) also has 2 = Sredina (middle); Kušet AC (4-berth) has only upper/lower.
  - Postelja / sleeper (TIPU 3): 0 = Svejedno, 1 = Dole (lower), 3 = Gore (upper); Single has no choice
- `POLU`: passenger gender (`M` = Muski/male, `Z` = Zenski/female), for shared compartments

Response returns `ordeR_ID`, `broJ_KOLA` (car), `mestO_1` (seat/berth), `pozicijA_1`, price RSD (`cenA_1`) + EUR (`cenA_1E`), `koD_ODGOVORA` (0 = OK, 1 = failure), `broJ_REZERVACIJE`.

The requested position is honoured when available; if sold out, the next free place in the type is assigned. Verified: seat `POZICIJAU: 3` → `prozor` (car 466, seat 56, 3 €); Kušet BC `POZICIJAU: 1` (Gore) → `gore` (car 470, berth 95, 8 €); Postelja Turist → car 461, berth 51, 16 €.

### Car transport (Auto)

`TIPU: 4, TIP_KABINE: 1, POZICIJAU: 0` → 40 € (verified: car 388, place 09). Only on **Zemun → Bar**, vehicle height ≤ 1.55 m. In the UI it is a checkbox added to a seat booking, not a standalone type — the car reuses the **same `ORDER_IDU`** as the passenger place (a second `WEB_REZ_MS` call with `TIPU: 4`). Vehicle details go in at purchase (`karta/post`), inside `ETKARTADATA.auto`: `{kategorija, kategorijaID, stranaRegistracija (country), marka, vlasnik (owner), registracija (plate), redni_broj}`.

### Children

Children under 6 travel free and are not counted as passengers, unless they occupy their own seat — then charged like a child 6–14 (`sifra_povlastice` 51).

### Return journey

A round trip shares a **single `ORDER_IDU`**: outbound and return legs are each reserved with their own `WEB_REZ_MS` call (different `BROJ_VOZAU`, `DAT_SAOBRACAJAU`, reversed `OD`/`DO`). Verified: outbound voz 433 Zemun→Bar (28.09) + return voz 432 Bar→Zemun (29.09) on one order. In `ETKARTADATA` the return leg uses parallel `…p` fields (p = *povratak*): `cenep`, `ukupnaCenap`, `totalCenap`, `cenaMestap`, `cenaMestaAutop`, `resultDataTCVp`, `vozDatap`. Return tickets get an automatic 20 % discount.

Status:
```
GET /OrkaRezervacijaPlan/WEB_StatusZa_RezOrderTMP?OrderIdTMP=SVOID84702117
GET /OrkaRezervacijaPlan/WEB_VratiOraRezervacijuMS?OrderId=SVOID84702117
```

`WEB_VratiOraRezervacijuMS` returns `paymentProtection`/`protectionMinutes` (payment hold window, ~20 min) and cancellation eligibility. Once purchase started: `"REZERVACIJA NE MOZE DA SE OTKAZE JER JE KUPOVINA U TOKU"`.

## Purchase

```
POST /karta/post
```

Body includes `ID_USER`, route (`OD`/`DO`/`VOZA`/`RAZREDA`), `UKUPNA_CENA` (RSD), `ET_REZ_ORDER_TMP` (the reservation being settled), `BROJ_OSNOVNE_KARTE`, `TIP_KARTE`, and `ETKARTADATA` — a **JSON-stringified** payload with `putnici[]` (passengers: `imeprezime`, `datumrodjenja`, `sifrapovlastice`), price arrays (`cene`/`ceneEur`), and a full `vozData` snapshot. For a car booking `ETKARTADATA` also carries `auto` (`{kategorija, kategorijaID, stranaRegistracija, marka, vlasnik, registracija, redni_broj}`), `cenaMestaAuto`, and `mestaAuto`.

Response: `{"error": 0, "oid": "SVOID...", ...}`. Non-zero `error` = failure:
- `9098` "Kupovina za ovu rezervaciju je vec pokrenuta" (purchase already started, `unos: duplikat_rezervacije`)
- `9013` "Obracun cene nije kompletan" (price mismatch — response carries `clientAmount` / `serverAmount` / `difference`; the server validates the total before forwarding to the bank)

## Order IDs

Temporary order IDs use the `SVOID<digits>` format. A reservation carries both a `reZ_ORDER_TMP_ID` and an `eT_ORDER_ID` (e-ticket order).

## Account & Orders

- `GET /user/GetPagedOrders?ID_USER=&pageNumber=&pageSize=` → `{totalOrders, orders[]}`. Each order is a full snapshot (`ordeR_ID`, `od`/`do`, `voza`, `ukupnA_CENA`, stringified `etkartadata`) plus `placena` (payment status; an error code like 9013 = never paid). Return-journey legs use parallel `…R` fields (`vozr`, `razredr`, `vremE_POLASKAR`, …).
- `GET /user/korisnik?iduser=` → array with the profile (`username`, `ime`, `prezime`, `promo`, `statuS_AKTIVACIJE`, push-notification flags). `lozinka` is always null.
- `GET /zavrsena?oid=` → completed order / e-ticket. Returns HTTP 500 for orders that were never paid.

## Notes

- Dates use inconsistent formats per endpoint: search `YYYY-M-D`, TCV `D-M-YYYY`, reservation `M-D-YYYY`, purchase `DD-MM-YYYY`. Match each exactly.
- `soko` flag marks SOKO high-speed services (e.g. Beograd–Subotica); the night train is IR, not SOKO.
- Prices are dual-currency (RSD + EUR) with a fixed `KURS`.
- SPA controllers reveal the flow: `medjunarodniController` (international search), `putniciMedjunarodni` (passenger entry), `kupovinaController` (purchase).
- Endpoint probes (empty body): `karta/VracanjeMail` → `"bad google"` (expects a reCAPTCHA token); `user/PostUser` + `user/zaboravljena` → HTTP 500; `auth/logout` → `{success:true}`. `user/post_zaboravljenaV2` sets a new password and validates in order: no `username` → HTTP 400 `"Username nije prosledjen."`, then no `lozinka` → HTTP 400 `"Lozinka nije prosledjena."` — so it expects `{username, lozinka}`.
- **Password reset is e-mail-verified, not immediate.** `post_zaboravljenaV2` returns `{email, error, verificationRequired: true}` and sends a "POTVRDI PROMENU LOZINKE" mail; the new password activates only after the user clicks the link. The old password is invalidated immediately, so the account is locked out until the mail is confirmed. Reversible but mail-bound.
- **Order payment status:** `GetPagedOrders` orders carry `placena` — an error code (e.g. 9013) means the payment never completed. `zavrsena?oid=` returns HTTP 500 for such unpaid orders; only successfully paid orders resolve.
