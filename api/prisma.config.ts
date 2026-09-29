import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Not `env()`: it throws when unset, and `prisma generate` runs on install
    // (CI, Docker build) where there is no database.
    url: process.env.DATABASE_URL,
  },
});
