import { ConflictException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationsService } from './reservations.service.js';

function makePrismaMock(
  createImpl: () => Promise<unknown>,
  charger: unknown = {
    id: 'charger-1',
    station: { opensAtMinute: null, closesAtMinute: null },
  },
) {
  return {
    charger: { findUnique: vi.fn(() => Promise.resolve(charger)) },
    reservation: {
      create: vi.fn(createImpl),
    },
  };
}

function makeRealtimeMock() {
  return { emitSlotUpdated: vi.fn() };
}

describe('ReservationsService#create', () => {
  // Fixtures book 2026-10-01 slots, so pin "now" to before them.
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['Date'],
      now: new Date('2026-09-30T12:00:00Z'),
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects a slot outside the station opening hours with 409 STATION_CLOSED', async () => {
    const prisma = makePrismaMock(() => Promise.resolve({}), {
      id: 'charger-1',
      station: { opensAtMinute: 8 * 60, closesAtMinute: 20 * 60 },
    });
    const service = new ReservationsService(
      prisma as never,
      makeRealtimeMock() as never,
    );

    await expect(
      service.create('user-1', {
        chargerId: 'charger-1',
        slotStart: '2026-10-01T21:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({ code: 'STATION_CLOSED' }),
    });
    expect(prisma.reservation.create).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown charger', async () => {
    const prisma = makePrismaMock(() => Promise.resolve({}), null);
    const service = new ReservationsService(
      prisma as never,
      makeRealtimeMock() as never,
    );

    await expect(
      service.create('user-1', {
        chargerId: 'charger-x',
        slotStart: '2026-10-01T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it.each(['2026-10-01T14:07:00.000Z', '2026-10-01T14:30:15.000Z'])(
    'rejects %s, which is not on a 30-minute boundary, with 400 INVALID_SLOT',
    async (slotStart) => {
      const prisma = makePrismaMock(() => Promise.resolve({}));
      const service = new ReservationsService(
        prisma as never,
        makeRealtimeMock() as never,
      );

      await expect(
        service.create('user-1', { chargerId: 'charger-1', slotStart }),
      ).rejects.toMatchObject({
        status: 400,
        response: expect.objectContaining({ code: 'INVALID_SLOT' }),
      });
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['in the past', '2026-09-30T11:30:00.000Z'],
    ['already started', '2026-09-30T12:00:00.000Z'],
  ])(
    'rejects a slot that is %s with 409 SLOT_IN_PAST',
    async (_, slotStart) => {
      const prisma = makePrismaMock(() => Promise.resolve({}));
      const service = new ReservationsService(
        prisma as never,
        makeRealtimeMock() as never,
      );

      await expect(
        service.create('user-1', { chargerId: 'charger-1', slotStart }),
      ).rejects.toMatchObject({
        status: 409,
        response: expect.objectContaining({ code: 'SLOT_IN_PAST' }),
      });
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    },
  );

  it('maps a Prisma P2002 unique violation to a 409 SLOT_TAKEN conflict', async () => {
    const prisma = makePrismaMock(() =>
      Promise.reject(
        Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
        }),
      ),
    );
    const service = new ReservationsService(
      prisma as never,
      makeRealtimeMock() as never,
    );

    await expect(
      service.create('user-1', {
        chargerId: 'charger-1',
        slotStart: '2026-10-01T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({ code: 'SLOT_TAKEN' }),
    });
  });

  it('lets other Prisma errors propagate', async () => {
    const prisma = makePrismaMock(() =>
      Promise.reject(new Error('connection lost')),
    );
    const service = new ReservationsService(
      prisma as never,
      makeRealtimeMock() as never,
    );

    await expect(
      service.create('user-1', {
        chargerId: 'charger-1',
        slotStart: '2026-10-01T10:00:00.000Z',
      }),
    ).rejects.toThrow('connection lost');
  });

  it('is a ConflictException instance on P2002', async () => {
    const prisma = makePrismaMock(() =>
      Promise.reject(Object.assign(new Error('dup'), { code: 'P2002' })),
    );
    const service = new ReservationsService(
      prisma as never,
      makeRealtimeMock() as never,
    );

    await expect(
      service.create('user-1', {
        chargerId: 'charger-1',
        slotStart: '2026-10-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('emits slot.updated via the realtime gateway after a successful booking', async () => {
    const created = {
      chargerId: 'charger-1',
      slotStart: new Date('2026-10-01T10:00:00.000Z'),
      status: 'BOOKED',
    };
    const prisma = makePrismaMock(() => Promise.resolve(created));
    const realtime = makeRealtimeMock();
    const service = new ReservationsService(prisma as never, realtime as never);

    await service.create('user-1', {
      chargerId: 'charger-1',
      slotStart: '2026-10-01T10:00:00.000Z',
    });

    expect(realtime.emitSlotUpdated).toHaveBeenCalledWith({
      chargerId: 'charger-1',
      slotStart: '2026-10-01T10:00:00.000Z',
      status: 'BOOKED',
    });
  });
});
