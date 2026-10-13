-- Existing rows get Europe/London; opening hours are now local wall-clock minutes in this zone.
ALTER TABLE "Station" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'Europe/London';
ALTER TABLE "Station" ALTER COLUMN "timeZone" DROP DEFAULT;
