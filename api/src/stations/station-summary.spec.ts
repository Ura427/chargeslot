import { describe, expect, it } from 'vitest';
import { summarizeStation } from './station-summary.js';

const now = new Date('2026-10-01T14:10:00Z');

const station = {
  timeZone: 'UTC',
  opensAtMinute: null,
  closesAtMinute: null,
  chargers: [
    { id: 'a', connectorType: 'CCS2' as const, powerKw: 150 },
    { id: 'b', connectorType: 'TYPE2' as const, powerKw: 22 },
    { id: 'c', connectorType: 'CCS2' as const, powerKw: 50 },
  ],
};

const booked = (chargerId: string, iso: string) => ({
  chargerId,
  slotStart: new Date(iso),
});

describe('summarizeStation', () => {
  it('reports max power and distinct connector types', () => {
    const summary = summarizeStation(station, [], now);
    expect(summary.maxPowerKw).toBe(150);
    expect(summary.connectorTypes).toEqual(['CCS2', 'TYPE2']);
  });

  it('uses the next slot that has not started, with all chargers free', () => {
    const summary = summarizeStation(station, [], now);
    expect(summary.nextFreeAt).toBe('2026-10-01T14:30:00.000Z');
    expect(summary.freeChargersAtNext).toBe(3);
  });

  it('counts only chargers that are free in that slot', () => {
    const summary = summarizeStation(
      station,
      [booked('a', '2026-10-01T14:30:00Z')],
      now,
    );
    expect(summary.nextFreeAt).toBe('2026-10-01T14:30:00.000Z');
    expect(summary.freeChargersAtNext).toBe(2);
  });

  it('skips a slot where every charger is booked', () => {
    const summary = summarizeStation(
      station,
      ['a', 'b', 'c'].map((id) => booked(id, '2026-10-01T14:30:00Z')),
      now,
    );
    expect(summary.nextFreeAt).toBe('2026-10-01T15:00:00.000Z');
  });

  it('skips closed hours', () => {
    const summary = summarizeStation(
      { ...station, opensAtMinute: 16 * 60, closesAtMinute: 20 * 60 },
      [],
      now,
    );
    expect(summary.nextFreeAt).toBe('2026-10-01T16:00:00.000Z');
  });

  it('returns null when nothing is free in the next 24 hours', () => {
    const summary = summarizeStation({ ...station, chargers: [] }, [], now);
    expect(summary.nextFreeAt).toBeNull();
    expect(summary.freeChargersAtNext).toBe(0);
  });
});
