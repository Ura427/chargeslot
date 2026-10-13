# UI rework + correctness fixes

Branch `feature/ui-rework`. Agreed 2026-10-13 via grilling session.

## Order of work

1. **Concurrency e2e** — `api/test/reservations.concurrency.e2e-spec.ts`: 10 distinct users book the same slot via `Promise.all` against real Postgres. Expect 1×201, 9×409, exactly 1 active row. Runs in CI. Restore the README claim once green.
2. **Past slots** — availability returns only slots that have not started; `POST /reservations` rejects a slot whose start ≤ now (409 `SLOT_IN_PAST`). Tests first.
3. **Schema + seed** — Station gains `imageUrl`, `city`, `openingHours` (null = 24/7, else `{ open: "HH:MM", close: "HH:MM" }` UTC). Slots outside hours are neither offered nor bookable. Seed grows to ~6 stations mixing AC ≤22 kW, 50 kW, 150 kW+.
4. **Stations summary** — `GET /stations` adds `maxPowerKw`, `connectorTypes`, `freeNow`, `nextFreeAt`, computed with one grouped query (no N+1).
5. **Design tokens** — light only, one accent, one font, brand mark in NavBar.
6. **Home cards** — photo (gradient fallback), city, hours, speed-tier badge (Slow ≤22 / Fast ≤50 / Ultra >50 kW), connectors, "X free now / next free at HH:MM", skeletons, empty states.
7. **Station page** — slots grouped morning/afternoon/evening, next free slot highlighted, tier per charger, confirmation sheet (charger, time, power, cancel-policy line).
8. **`baseQueryWithReauth`** — 401 → single shared refresh (mutex) → retry; refresh failure → `loggedOut()`. Tested.
9. **`useLiveAvailability`** — subscribe to `slot.updated`, patch cached availability in place, unsubscribe on unmount. Tested.

## Added after steps 1–2

- **README honesty** — the "automatic token refresh" line describes step 8; soften it until step 8 lands.
- **Expiry job e2e** — real-Postgres test that a no-show reservation is expired and the slot freed.
- **Open decision (before step 7)** — "Today" is a UTC day. Recommended: browser sends its IANA timezone, server builds the day in it.

## Out of scope

7-day date strip, filters, dark mode, amenities, km-range estimates.

## User provides

6 station photos in `web/public/stations/` (prompts in `.planning/specs/station-image-prompts.md`).
