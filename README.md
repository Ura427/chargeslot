# ChargeSlot

[![CI](https://github.com/Ura427/chargeslot/actions/workflows/ci.yml/badge.svg)](https://github.com/Ura427/chargeslot/actions/workflows/ci.yml)

A full-stack EV charger reservation app. Drivers book a 30-minute slot, check in on arrival, and see availability update live. A booking that isn't checked in within 10 minutes of its start expires and frees the slot automatically.

ChargeSlot focuses on the parts of a booking system that are easy to get wrong:

- **No double booking under concurrent requests**, enforced by the database rather than by application code
- **Holds that expire on their own**, without waiting for someone to request the data
- **Refresh-token rotation with theft detection**
- **Live availability updates** over WebSockets

## Stack

| Layer    | Technology                                                                          |
| -------- | ----------------------------------------------------------------------------------- |
| API      | NestJS 12, Prisma 7, PostgreSQL 18                                                  |
| Web      | React 19, Vite 8, Redux Toolkit Query, Tailwind CSS 4                               |
| Realtime | WebSocket gateway (`slot.updated` events)                                           |
| Tests    | Vitest, Supertest, React Testing Library                                            |
| Tooling  | npm workspaces, strict TypeScript, Oxlint, Prettier, Docker Compose, GitHub Actions |

## Run locally

**Quickest: Docker only** (no Node, no setup)

```bash
docker compose up --build
```

Open http://localhost:8080. Postgres starts, a one-off `migrate` service applies migrations and seeds 3 stations, then the API comes up on http://localhost:3000 and the web app on http://localhost:8080. `bash scripts/docker-smoke.sh` runs the same end-to-end check CI runs against this stack.

**Development setup** (Node 24 + Docker, hot reload, web client)

```bash
npm install
cp api/.env.example api/.env && cp web/.env.example web/.env
npm run db:setup   # starts Postgres in Docker, applies migrations, seeds 3 stations
npm run dev        # API on http://localhost:3000, web on http://localhost:5173
```

## What works today

- Register / log in, with short-lived access tokens and rotating refresh tokens
- Station list with photos, charging speed, plug types and the next free slot
- Per-charger slot grid in the station's local time, with opening hours enforced
- Book, cancel and check in to a reservation
- Bookings by other drivers appear live, without a refetch
- Sessions survive a reload and expired access tokens refresh silently
- Automatic expiry of no-shows, once a minute
- One-command startup of the whole stack with Docker Compose, smoke-tested in CI on every push
- One-command backend startup with Docker Compose, safe to restart against existing data

## Architecture decisions

- **Double booking is prevented by the database.** A partial unique index on `(chargerId, slotStart)` covers only active reservations (`BOOKED`, `CHECKED_IN`). When two requests race for the same slot, one insert fails with a unique violation, which the service maps to `409 SLOT_TAKEN`. A "check, then insert" in application code would let both through. `api/test/reservations.concurrency.e2e-spec.ts` proves it: 10 users book one slot at once against real PostgreSQL, and exactly one gets `201` while nine get `409`.
- **Refresh tokens rotate, with reuse detection.** Each `/auth/refresh` issues a new token and revokes the old one. If an already-used token is presented again (the signature of a stolen token being replayed), the whole token family is revoked, logging out every session that shared it.
- **Expiry runs on a schedule, not lazily on read.** A cron job sweeps for no-shows every minute and emits `slot.updated` itself, so slots free up and connected clients see it even if nobody requests that station afterwards.
- **Timestamps are UTC end to end; calendar days belong to the station.** All columns are `timestamptz` and the API sends ISO 8601 with `Z`. Each station stores an IANA time zone, and its opening hours are local wall-clock times, so "08:00–22:00" stays right across daylight-saving changes and "today" means today where the charger is.
- **One query per concern, not per station.** `GET /stations` summarises every station's next free slot from two queries in total, whatever the number of stations.
- **Token refresh is single-flight in the client.** On a 401 the web client refreshes once and retries; requests that fail meanwhile wait on the same refresh. Two parallel refreshes would trip the server's reuse detection and log the user out.
- **Live updates patch the cache in place.** `slot.updated` events edit the cached availability with RTK Query's `updateQueryData`, so other drivers' bookings appear without a refetch flash.
- **No-shows expire in one statement.** The sweep is a single `UPDATE … RETURNING`, so a check-in landing mid-sweep is never overwritten. `api/test/expiry.e2e-spec.ts` runs it against real PostgreSQL.
- **Prisma 7 with a partial index in the schema.** The index is declared through Prisma's `partialIndexes` preview feature, so the schema stays the single source of truth instead of an index that lives only in raw SQL and gets dropped by the next migration.
- **Migrations are a separate step, not part of container start.** The runtime image doesn't need the Prisma CLI, and multiple API instances never race to migrate the same database.
- **npm workspaces monorepo.** One lockfile, one CI run, one Prettier config. At this size, Nx or Turborepo would add more than they save.

## Roadmap

- Screenshots / demo GIF.

## Where to look

- `api/src/reservations/reservations.service.ts`: the booking path and the unique-violation to `409` mapping
- `api/src/auth/auth.service.ts`: refresh rotation and family-based reuse detection
- `api/src/reservations/expiry.job.ts`: the no-show sweep and socket event
- `web/src/api/baseQueryWithReauth.ts`: single-flight token refresh and retry
- `web/src/features/availability/useLiveAvailability.ts`: live cache patching from socket events
- `api/src/stations/time-zone.ts`: station-local days and hours without a date library

## License

[MIT](LICENSE) © 2026 Yura Kost
