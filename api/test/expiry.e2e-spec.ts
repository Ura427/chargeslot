import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';

// Hits the real database (DATABASE_URL). JWT secrets only need to pass env validation.
process.env.JWT_ACCESS_SECRET ??=
  'e2e-access-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET ??=
  'e2e-refresh-secret-at-least-32-characters-long';
process.env.WEB_ORIGIN ??= 'http://localhost:5173';
process.env.PORT ??= '3000';

const { AppModule } = await import('../src/app.module.js');
const { PrismaService } = await import('../src/prisma/prisma.service.js');
const { ExpiryJob } = await import('../src/reservations/expiry.job.js');

const MINUTE = 60_000;
// Slot-aligned instants relative to now, so they satisfy the 30-minute grid.
const slotAgo = (minutes: number) => {
  const aligned = Math.floor(Date.now() / (30 * MINUTE)) * 30 * MINUTE;
  return new Date(aligned - minutes * MINUTE);
};

describe('ExpiryJob against PostgreSQL', () => {
  let app: INestApplication;
  let prisma: InstanceType<typeof PrismaService>;
  let job: InstanceType<typeof ExpiryJob>;
  const runId = randomUUID().slice(0, 8);
  let stationId: string;
  let chargerId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    job = app.get(ExpiryJob);

    const station = await prisma.station.create({
      data: {
        name: `e2e-expiry-${runId}`,
        address: 'test',
        city: 'test',
        timeZone: 'UTC',
        chargers: { create: { connectorType: 'CCS2', powerKw: 50 } },
      },
      include: { chargers: true },
    });
    stationId = station.id;
    chargerId = station.chargers[0].id;
    const user = await prisma.user.create({
      data: { email: `e2e-expiry-${runId}@example.com`, passwordHash: 'x' },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany({ where: { chargerId } });
    await prisma.charger.deleteMany({ where: { stationId } });
    await prisma.station.delete({ where: { id: stationId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('expires only BOOKED no-shows past the check-in window and frees the slot', async () => {
    const book = (slotStart: Date, status: 'BOOKED' | 'CHECKED_IN') =>
      prisma.reservation.create({
        data: { userId, chargerId, slotStart, status },
      });
    const noShow = await book(slotAgo(60), 'BOOKED');
    const checkedIn = await book(slotAgo(90), 'CHECKED_IN');
    // Started 5 minutes ago: still inside its 10-minute check-in window.
    const inWindow = await book(new Date(Date.now() - 5 * MINUTE), 'BOOKED');

    await job.expireNoShows();

    const status = async (id: string) =>
      (await prisma.reservation.findUniqueOrThrow({ where: { id } })).status;
    expect(await status(noShow.id)).toBe('EXPIRED');
    expect(await status(checkedIn.id)).toBe('CHECKED_IN');
    expect(await status(inWindow.id)).toBe('BOOKED');

    // The partial unique index ignores EXPIRED rows, so the slot can be booked again.
    await expect(book(noShow.slotStart, 'BOOKED')).resolves.toBeDefined();
  });
});
