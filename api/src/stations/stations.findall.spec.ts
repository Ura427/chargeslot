import { describe, expect, it, vi } from 'vitest';
import { StationsService } from './stations.service.js';

describe('StationsService#findAll', () => {
  it('loads every station summary with two queries, however many stations', async () => {
    const stations = Array.from({ length: 5 }, (_, i) => ({
      id: `s${i}`,
      opensAtMinute: null,
      closesAtMinute: null,
      chargers: [{ id: `c${i}`, connectorType: 'CCS2', powerKw: 50 }],
    }));
    const prisma = {
      station: { findMany: vi.fn(() => Promise.resolve(stations)) },
      reservation: { findMany: vi.fn(() => Promise.resolve([])) },
    };
    const service = new StationsService(prisma as never);

    const result = await service.findAll();

    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('nextFreeAt');
    expect(prisma.station.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.reservation.findMany).toHaveBeenCalledTimes(1);
  });
});
