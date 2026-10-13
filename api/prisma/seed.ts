import { PrismaPg } from '@prisma/adapter-pg';
import { ConnectorType, PrismaClient } from '../src/generated/prisma/client.js';

const { CCS2, CHADEMO, TYPE2 } = ConnectorType;

// Fixed ids make re-running the seed safe: stations are upserted, chargers skip duplicates.
const seedId = (n: number) =>
  `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

const hours = (opens: number, closes: number) => ({
  opensAtMinute: opens * 60,
  closesAtMinute: closes * 60,
});
const UK = 'Europe/London';
const allDay = { opensAtMinute: null, closesAtMinute: null };

// Opening hours are local wall-clock time in each station's zone.
const stations = [
  {
    id: seedId(1),
    name: 'City Centre Garage',
    address: '1 Market Square',
    city: 'Manchester',
    timeZone: UK,
    imageUrl: '/stations/city-centre.jpg',
    ...hours(7, 23),
  },
  {
    id: seedId(2),
    name: 'Riverside Park & Ride',
    address: '48 River Road',
    city: 'Nottingham',
    timeZone: UK,
    imageUrl: '/stations/riverside.jpg',
    ...allDay,
  },
  {
    id: seedId(3),
    name: 'Airport Long-Stay',
    address: '3 Terminal Drive',
    city: 'Birmingham',
    timeZone: UK,
    imageUrl: '/stations/airport.jpg',
    ...allDay,
  },
  {
    id: seedId(4),
    name: 'Forum Retail Park',
    address: '12 Shopping Avenue',
    city: 'Leeds',
    timeZone: UK,
    imageUrl: '/stations/retail-park.jpg',
    ...hours(8, 22),
  },
  {
    id: seedId(5),
    name: 'M6 Service Area',
    address: 'Junction 16, M6',
    city: 'Stoke-on-Trent',
    timeZone: UK,
    imageUrl: '/stations/highway.jpg',
    ...allDay,
  },
  {
    id: seedId(6),
    name: 'Green Street Kerbside',
    address: '27 Green Street',
    city: 'London',
    timeZone: UK,
    imageUrl: '/stations/residential.jpg',
    ...allDay,
  },
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
  charger(401, 4, TYPE2, 22),
  charger(402, 4, TYPE2, 22),
  charger(403, 4, CCS2, 50),
  charger(501, 5, CCS2, 350),
  charger(502, 5, CCS2, 150),
  charger(503, 5, CCS2, 150),
  charger(504, 5, CHADEMO, 50),
  charger(601, 6, TYPE2, 7),
  charger(602, 6, TYPE2, 7),
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  // Upsert stations so re-seeding an existing database also fills newly added fields.
  await prisma.$transaction(
    stations.map((station) =>
      prisma.station.upsert({
        where: { id: station.id },
        create: station,
        update: station,
      }),
    ),
  );
  const chargerResult = await prisma.charger.createMany({
    data: chargers,
    skipDuplicates: true,
  });
  console.log(
    `Seed: ${stations.length} stations upserted, ${chargerResult.count} chargers inserted.`,
  );
} finally {
  await prisma.$disconnect();
}
