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

Milestone 1 of 5: scaffold (workspaces, schema and first migration, seed, health check, Docker,
CI). Next: auth, stations and reservations API.

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

## Files worth reading

_Added as the features land._

## License

[MIT](LICENSE) © 2026 Yura Kost
