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

**Quickest: Docker only** (no Node needed)

```bash
docker compose up --build
```

Postgres starts, migrations and seed data are applied by a one-off `migrate` service, then the API comes up on http://localhost:3000. `curl localhost:3000/health` returns `{"status":"ok"}`.

**Development setup** (Node 24 + Docker, hot reload, web client)

```bash
npm install
cp api/.env.example api/.env && cp web/.env.example web/.env
npm run db:setup   # starts Postgres in Docker, applies migrations, seeds 3 stations
npm run dev        # API on http://localhost:3000, web on http://localhost:5173
```

## What works today

- Register / log in, with short-lived access tokens and rotating refresh tokens
- Station list and a slot grid per charger
- Book, cancel and check in to a reservation
- Automatic expiry of no-shows, once a minute
- One-command backend startup with Docker Compose, safe to restart against existing data

## Architecture decisions

- **Double booking is prevented by the database.** A partial unique index on `(chargerId, slotStart)` covers only active reservations (`BOOKED`, `CHECKED_IN`). When two requests race for the same slot, one insert fails with a unique violation, which the service maps to `409 SLOT_TAKEN`. A "check, then insert" in application code would let both through.
- **Refresh tokens rotate, with reuse detection.** Each `/auth/refresh` issues a new token and revokes the old one. If an already-used token is presented again (the signature of a stolen token being replayed), the whole token family is revoked, logging out every session that shared it.
- **Expiry runs on a schedule, not lazily on read.** A cron job sweeps for no-shows every minute and emits `slot.updated` itself, so slots free up and connected clients see it even if nobody requests that station afterwards.
- **Timestamps are UTC end to end.** All columns are `timestamptz`, the API sends ISO 8601 with `Z`, and only the UI converts to local time.
- **Prisma 7 with a partial index in the schema.** The index is declared through Prisma's `partialIndexes` preview feature, so the schema stays the single source of truth instead of an index that lives only in raw SQL and gets dropped by the next migration.
- **Migrations are a separate step, not part of container start.** The runtime image doesn't need the Prisma CLI, and multiple API instances never race to migrate the same database.
- **npm workspaces monorepo.** One lockfile, one CI run, one Prettier config. At this size, Nx or Turborepo would add more than they save.

## Roadmap

- **Live cache patching.** The web client currently invalidates the availability cache after a change and refetches. Next step: subscribe to `slot.updated` and patch the RTK Query cache in place (`updateQueryData`), so updates from other users appear without a refetch flash.
- **Automatic token refresh in the client.** On a 401, refresh once and retry the original request, with a mutex so concurrent 401s share a single refresh call.
- Screenshots / demo GIF.

## Where to look

- `api/src/reservations/reservations.service.ts`: the booking path and the unique-violation to `409` mapping
- `api/src/auth/auth.service.ts`: refresh rotation and family-based reuse detection
- `api/src/reservations/expiry.job.ts`: the no-show sweep and socket event
- `web/src/api/baseQueryWithReauth.ts` and `web/src/features/availability/useLiveAvailability.ts`: the two client pieces covered by the roadmap

## License

[MIT](LICENSE) © 2026 Yura Kost
