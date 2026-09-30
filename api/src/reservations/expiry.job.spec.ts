import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpiryJob } from './expiry.job.js';
import { CHECK_IN_WINDOW_MS } from './reservations.service.js';

function makePrismaMock(reservations: unknown[]) {
  return {
    reservation: {
      findMany: vi.fn().mockResolvedValue(reservations),
      updateMany: vi.fn().mockResolvedValue({ count: reservations.length }),
    },
  };
}

function makeRealtimeMock() {
  return { emitSlotUpdated: vi.fn() };
}

describe('ExpiryJob#expireNoShows', () => {
  const now = new Date('2026-10-01T10:30:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expires a reservation whose check-in window has passed and notifies the gateway', async () => {
    const pastSlotStart = new Date(now.getTime() - CHECK_IN_WINDOW_MS - 1000);
    const reservation = {
      id: 'res-1',
      chargerId: 'charger-1',
      slotStart: pastSlotStart,
      status: 'BOOKED',
    };
    const prisma = makePrismaMock([reservation]);
    const realtime = makeRealtimeMock();
    const job = new ExpiryJob(prisma as never, realtime as never);

    await job.expireNoShows();

    expect(prisma.reservation.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['res-1'] } },
      data: { status: 'EXPIRED' },
    });
    expect(realtime.emitSlotUpdated).toHaveBeenCalledWith({
      chargerId: 'charger-1',
      slotStart: pastSlotStart.toISOString(),
      status: 'EXPIRED',
    });
  });

  it('does not touch a reservation still inside its check-in window', async () => {
    const prisma = makePrismaMock([]);
    const realtime = makeRealtimeMock();
    const job = new ExpiryJob(prisma as never, realtime as never);

    await job.expireNoShows();

    expect(prisma.reservation.updateMany).not.toHaveBeenCalled();
    expect(realtime.emitSlotUpdated).not.toHaveBeenCalled();
  });
});
