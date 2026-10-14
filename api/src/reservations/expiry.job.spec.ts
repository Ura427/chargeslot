import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpiryJob } from './expiry.job.js';
import { CHECK_IN_WINDOW_MS } from './reservations.service.js';

function makePrismaMock(expired: unknown[]) {
  return {
    reservation: {
      updateManyAndReturn: vi.fn().mockResolvedValue(expired),
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

  it('expires BOOKED no-shows in one statement, so a concurrent check-in is never overwritten', async () => {
    const prisma = makePrismaMock([]);
    const job = new ExpiryJob(prisma as never, makeRealtimeMock() as never);

    await job.expireNoShows();

    expect(prisma.reservation.updateManyAndReturn).toHaveBeenCalledTimes(1);
    expect(prisma.reservation.updateManyAndReturn).toHaveBeenCalledWith({
      where: {
        status: 'BOOKED',
        slotStart: { lt: new Date(now.getTime() - CHECK_IN_WINDOW_MS) },
      },
      data: { status: 'EXPIRED' },
    });
  });

  it('notifies the gateway for each expired reservation', async () => {
    const slotStart = new Date(now.getTime() - CHECK_IN_WINDOW_MS - 1000);
    const prisma = makePrismaMock([
      { id: 'res-1', chargerId: 'charger-1', slotStart, status: 'EXPIRED' },
    ]);
    const realtime = makeRealtimeMock();
    const job = new ExpiryJob(prisma as never, realtime as never);

    await job.expireNoShows();

    expect(realtime.emitSlotUpdated).toHaveBeenCalledWith({
      chargerId: 'charger-1',
      slotStart: slotStart.toISOString(),
      status: 'EXPIRED',
    });
  });

  it('emits nothing when there are no no-shows', async () => {
    const realtime = makeRealtimeMock();
    const job = new ExpiryJob(makePrismaMock([]) as never, realtime as never);

    await job.expireNoShows();

    expect(realtime.emitSlotUpdated).not.toHaveBeenCalled();
  });
});
