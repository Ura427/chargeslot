import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

// Hits the real database (DATABASE_URL). JWT secrets only need to pass env validation.
process.env.JWT_ACCESS_SECRET ??=
  'e2e-access-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET ??=
  'e2e-refresh-secret-at-least-32-characters-long';
process.env.WEB_ORIGIN ??= 'http://localhost:5173';
process.env.PORT ??= '3000';

const { AppModule } = await import('../src/app.module.js');
const { PrismaService } = await import('../src/prisma/prisma.service.js');

const USERS = 10;

describe('POST /reservations under concurrency', () => {
  let app: INestApplication;
  let prisma: InstanceType<typeof PrismaService>;
  const runId = randomUUID().slice(0, 8);
  let stationId: string;
  let chargerId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // A charger of our own, so the test never collides with seed data or other runs.
    const station = await prisma.station.create({
      data: {
        name: `e2e-${runId}`,
        address: 'test',
        city: 'test',
        timeZone: 'UTC',
        chargers: { create: { connectorType: 'CCS2', powerKw: 50 } },
      },
      include: { chargers: true },
    });
    stationId = station.id;
    chargerId = station.chargers[0].id;
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany({ where: { chargerId } });
    await prisma.charger.deleteMany({ where: { stationId } });
    await prisma.station.delete({ where: { id: stationId } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: `e2e-${runId}-` } },
    });
    await app.close();
  });

  async function tokenFor(i: number): Promise<string> {
    const credentials = {
      email: `e2e-${runId}-${i}@example.com`,
      password: 'password123',
    };
    const server = app.getHttpServer();
    await request(server).post('/auth/register').send(credentials).expect(201);
    const res = await request(server)
      .post('/auth/login')
      .send(credentials)
      .expect(201);
    return res.body.accessToken as string;
  }

  it('lets exactly one of 10 simultaneous bookings for one slot succeed', async () => {
    const tokens = await Promise.all(
      Array.from({ length: USERS }, (_, i) => tokenFor(i)),
    );

    // Tomorrow, aligned to a 30-minute slot.
    const slot = new Date(Date.now() + 24 * 60 * 60 * 1000);
    slot.setUTCMinutes(0, 0, 0);
    const slotStart = slot.toISOString();

    const responses = await Promise.all(
      tokens.map((token) =>
        request(app.getHttpServer())
          .post('/reservations')
          .set('Authorization', `Bearer ${token}`)
          .send({ chargerId, slotStart }),
      ),
    );

    const statuses = responses.map((r) => r.status).sort((a, b) => a - b);
    expect(statuses).toEqual([201, ...Array(USERS - 1).fill(409)]);

    const active = await prisma.reservation.count({
      where: {
        chargerId,
        slotStart: slot,
        status: { in: ['BOOKED', 'CHECKED_IN'] },
      },
    });
    expect(active).toBe(1);
  });
});
