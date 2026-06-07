# NightJet API

## Base URL
`https://www.nightjet.com/nj-booking-ocp`

## Captcha System
Endpoints marked with captcha protection (CONNECTION, OFFER, PREBOOK) require a proof-of-work token:
1. `GET /captcha/challenge/{type}?from={eva}&to={eva}` → SHA-256 challenge
2. Client brute-forces `number` in [0, maxnumber] where `SHA256(salt + number) == challenge`
3. Solution encoded as base64 JSON: `{algorithm, challenge, number, salt, signature, took}`
4. Passed as `?captcha=` query param (URL-encoded)

## Booking Flow
1. `POST /init/start` → publicId, token, maxBookableDate
2. `GET /captcha/challenge/connection` → solve PoW
3. `GET /connection/{from}/{to}/{date}?captcha=...` → connections with short-lived JWT tokens
4. `POST /offer/get` (with connection token) → available offers/prices
5. `POST /route` (optional) → detailed route with polyline for map display
6. `GET /captcha/challenge/prebook` → solve PoW (no route params needed)
7. `POST /booking/payment-initialization` → ticketId + passenger data + selected offer → payment redirect
8. `GET /booking/offerValid?ticketId=` → check reservation still valid (after payment cancel/retry)
9. `GET /booking/finalize?token=&lang=` → complete after payment provider redirect

## Meta Stations
Some stations use "meta" EVA numbers (e.g. 8096009 for Hamburg, 1190100 for Wien) that group multiple actual stations.

## Train Types
- `dani` = standard NightJet (observed in connection responses)

## Discount Card Codes (from frontend bundle)
Key codes for the `cards` array in offer requests:
- **Germany**: 127 (BahnCard 25 2.Kl), 126 (BC25 1.Kl), 129 (BC50 2.Kl), 128 (BC50 1.Kl), 131 (BC100 2.Kl), 130 (BC100 1.Kl)
- **Austria**: 108 (VC Classic), 125 (VC Comfort), 118 (VC Senior), 120 (VC Jugend)
- **Switzerland**: 134 (Halbtax), 133 (GA 1.Kl), 136 (RailPlus)
- **International**: 2391 (Interrail/Eurail Globalpass)
