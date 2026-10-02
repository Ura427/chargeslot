# ChargeSlot

[![CI](https://github.com/Ura427/chargeslot/actions/workflows/ci.yml/badge.svg)](https://github.com/Ura427/chargeslot/actions/workflows/ci.yml)

ChargeSlot lets drivers reserve a 30-minute slot on an EV charger, check in when they arrive,
and see availability change live. A booking that is not checked in within 10 minutes of its
start expires and frees the slot. The project exists to show the parts of a booking system that
are easy to get wrong: no double booking under concurrent requests, holds that expire on their
own, refresh-token rotation, and live updates without refetch flicker.

## Stack

- **API:** NestJS 12, Prisma 7, PostgreSQL 18
- **Web:** React 19, Vite 8, Redux Toolkit Query, Tailwind CSS 4, tailwind-variants
- **Tests:** Vitest, Supertest, React Testing Library
- **Tooling:** npm workspaces, TypeScript (strict), Oxlint, Prettier, Docker Compose, GitHub Actions

## Run locally

Needs Node 24 and Docker.

```bash
npm install
cp api/.env.example api/.env && cp web/.env.example web/.env
npm run db:setup   # starts Postgres in Docker, applies migrations, seeds 3 stations
npm run dev        # API on http://localhost:3000, web on http://localhost:5173
```

`curl localhost:3000/health` returns `{"status":"ok"}`. To try the API's production image, stop
`npm run dev` and run `docker compose up --build`.

## Project status

All 5 milestones done: scaffold, auth + stations + reservations API, expiry job + WebSocket
gateway, web client (auth, station list, slot grid, booking/cancel/check-in), live-sync
infrastructure and this README. The app works end-to-end right now.

Now in the **rewrite phase**: per this project's authorship rule, the four files listed below
are deliberately left as stubs for the user to rewrite and understand line-by-line before the
repo link goes to anyone. Everything else was built by Claude; these four (plus the bonus
expiry job) are the interview surface.

## Decisions

- **npm workspaces monorepo.** The API and web app share one lockfile, one CI run and one
  Prettier config. At this size a build tool like Nx or Turborepo would add more than it saves.
- **Double booking is prevented by the database, not by app code.** A partial unique index on
  `(chargerId, slotStart)` covers only active reservations (`BOOKED`, `CHECKED_IN`). When two
  requests book the same slot at once, one insert fails with a unique violation and becomes a
  `409 SLOT_TAKEN`. A "check, then insert" in the service would let both through.
- **Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`).** NestJS 12 scaffolds as native
  ESM and Prisma 7 generates an ESM client, so no module-format workaround is needed. The partial
  index uses Prisma's `partialIndexes` preview feature, which keeps the schema the single source
  of truth; an index added only as raw SQL would be dropped by the next `prisma migrate dev`.
- **Migrations run as their own step, not on container start.** The runtime image stays free of
  the Prisma CLI, and several API instances never race to migrate the same database.
- **Timestamps are UTC end to end.** Every timestamp column is `timestamptz`; the API sends
  ISO 8601 with `Z`, and only the UI converts to local time.
- **Refresh tokens rotate, with reuse detection via a `familyId`.** Every `/auth/refresh` call
  issues a new refresh token and revokes the old one. If a revoked (already-used) token is
  presented again — the signal of a stolen token being replayed — the whole token family is
  revoked, logging out every session that shared it, not just the one that got caught.
- **Expiry runs on a cron tick, not lazily on read.** A `@nestjs/schedule` job sweeps for
  no-shows once a minute and emits `slot.updated` itself, so a slot frees (and every connected
  client sees it) even if nobody happens to request that station's availability afterward. Lazy
  expiry-on-read would leave stale `BOOKED` slots visible until the next unrelated read.
- **Cache invalidation today, socket-patched cache tomorrow.** Booking/cancelling/checking in
  currently invalidates the `Availability` tag and RTK Query refetches — simple, and enough to
  see the whole flow work, but it causes a visible flash and doesn't reflect other users'
  actions live. `useLiveAvailability.ts` is left as a stub (see below) for the user to replace
  this with `updateQueryData`-based patching driven by the `slot.updated` socket event, the same
  shape as the stubbed `baseQueryWithReauth.ts` from Milestone 4.

## Files worth reading

The authorship rule for this project: Claude built everything, but the five files below are
reserved for the user to rewrite and be able to explain unprompted. The repo link isn't sent to
anyone until that's true.

- `api/src/reservations/reservations.service.ts` — the booking path: how a 23505 unique
  violation from the DB's partial index becomes a `409 SLOT_TAKEN`, with no check-then-insert.
- `api/src/auth/auth.service.ts` — refresh token rotation and the reuse/theft-detection check
  via `familyId`.
- `api/src/reservations/expiry.job.ts` — bonus file: the cron sweep that expires no-shows and
  emits the socket event, worth reading alongside the cache-patching stub below.
- `web/src/api/baseQueryWithReauth.ts` — currently a plain base query (attaches the access
  token only); needs 401 → refresh → retry with a mutex so concurrent 401s share one refresh.
- `web/src/features/availability/useLiveAvailability.ts` — currently a no-op stub; needs to
  subscribe to the `slot.updated` socket event and patch the `getAvailability` RTK Query cache
  entry in place instead of refetching.

_Screenshot/GIF: not added yet — TODO once the live-sync rewrite is done and worth showing off._

## License

[MIT](LICENSE) © 2026 Yura Kost
