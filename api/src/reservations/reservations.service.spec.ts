import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ReservationsService } from './reservations.service.js';

function makePrismaMock(createImpl: () => Promise<unknown>) {
  return {
    reservation: {
      create: vi.fn(createImpl),
    },
  };
}

function makeRealtimeMock() {
  return { emitSlotUpdated: vi.fn() };
}

describe('ReservationsService#create', () => {
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
