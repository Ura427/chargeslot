import { PrismaPg } from '@prisma/adapter-pg';
import { ConnectorType, PrismaClient } from '../src/generated/prisma/client.js';

const { CCS2, CHADEMO, TYPE2 } = ConnectorType;

// Fixed ids plus `skipDuplicates` (ON CONFLICT DO NOTHING) make re-running the seed a no-op.
const seedId = (n: number) =>
  `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

const stations = [
  { id: seedId(1), name: 'City Centre Garage', address: '1 Market Square' },
  { id: seedId(2), name: 'Riverside Park & Ride', address: '48 River Road' },
  { id: seedId(3), name: 'Airport Long-Stay', address: '3 Terminal Drive' },
];

const charger = (
  id: number,
  station: number,
  connectorType: ConnectorType,
  powerKw: number,
) => ({ id: seedId(id), stationId: seedId(station), connectorType, powerKw });

const chargers = [
  charger(101, 1, CCS2, 150),
  charger(102, 1, CCS2, 50),
  charger(103, 1, TYPE2, 22),
  charger(201, 2, CHADEMO, 50),
  charger(202, 2, TYPE2, 11),
  charger(301, 3, CCS2, 350),
  charger(302, 3, CCS2, 150),
  charger(303, 3, TYPE2, 22),
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const [stationResult, chargerResult] = await prisma.$transaction([
    prisma.station.createMany({ data: stations, skipDuplicates: true }),
    prisma.charger.createMany({ data: chargers, skipDuplicates: true }),
  ]);
  console.log(
    `Seed: ${stationResult.count} stations and ${chargerResult.count} chargers inserted.`,
  );
} finally {
  await prisma.$disconnect();
}
