-- Existing rows get '' so the NOT NULL column can be added; the seed then fills real cities.
ALTER TABLE "Station" ADD COLUMN "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN "closesAtMinute" INTEGER,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "opensAtMinute" INTEGER;

ALTER TABLE "Station" ALTER COLUMN "city" DROP DEFAULT;

-- Hours are both set (opening before closing, within one day) or both null (24/7).
ALTER TABLE "Station" ADD CONSTRAINT "Station_opening_hours_check" CHECK (
  ("opensAtMinute" IS NULL AND "closesAtMinute" IS NULL)
  OR ("opensAtMinute" >= 0 AND "closesAtMinute" <= 1440 AND "opensAtMinute" < "closesAtMinute")
);
