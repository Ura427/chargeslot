import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StationsService } from './stations.service.js';

function makePrismaMock(
  hours: { opensAtMinute: number | null; closesAtMinute: number | null } = {
    opensAtMinute: null,
    closesAtMinute: null,
  },
) {
  return {
    station: {
      findUnique: vi.fn(() =>
        Promise.resolve({
          id: 'station-1',
          ...hours,
          chargers: [{ id: 'charger-1', connectorType: 'CCS2', powerKw: 50 }],
        }),
      ),
    },
    reservation: { findMany: vi.fn(() => Promise.resolve([])) },
  };
}

describe('StationsService#availability', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['Date'],
      now: new Date('2026-10-01T14:10:00Z'),
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('omits slots that have already started today', async () => {
    const service = new StationsService(makePrismaMock() as never);

    const result = await service.availability('station-1', '2026-10-01');
    const slots = result.chargers[0].slots;

    // 14:00 has started; 14:30 is the first bookable slot.
    expect(slots[0].slotStart).toBe('2026-10-01T14:30:00.000Z');
    expect(slots).toHaveLength(19);
  });

  it('returns the full day for a future date', async () => {
    const service = new StationsService(makePrismaMock() as never);

    const result = await service.availability('station-1', '2026-10-02');

    expect(result.chargers[0].slots).toHaveLength(48);
  });

  it('returns no slots for a past date', async () => {
    const service = new StationsService(makePrismaMock() as never);

    const result = await service.availability('station-1', '2026-09-30');

    expect(result.chargers[0].slots).toHaveLength(0);
  });

  it('only offers slots inside opening hours', async () => {
    const service = new StationsService(
      makePrismaMock({
        opensAtMinute: 8 * 60,
        closesAtMinute: 20 * 60,
      }) as never,
    );

    const result = await service.availability('station-1', '2026-10-02');
    const slots = result.chargers[0].slots;

    expect(slots).toHaveLength(24);
    expect(slots[0].slotStart).toBe('2026-10-02T08:00:00.000Z');
    expect(slots.at(-1)!.slotStart).toBe('2026-10-02T19:30:00.000Z');
  });
});
