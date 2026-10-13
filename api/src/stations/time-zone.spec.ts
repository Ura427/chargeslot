import { describe, expect, it } from 'vitest';
import { localDayStart, localMinuteOfDay } from './time-zone.js';

const LONDON = 'Europe/London';

describe('localDayStart', () => {
  it('is 00:00 UTC for a London winter day', () => {
    expect(localDayStart('2026-01-15', LONDON).toISOString()).toBe(
      '2026-01-15T00:00:00.000Z',
    );
  });

  it('is 23:00 UTC the day before for a London summer day (BST)', () => {
    expect(localDayStart('2026-07-01', LONDON).toISOString()).toBe(
      '2026-06-30T23:00:00.000Z',
    );
  });

  it('handles the day the clocks go forward', () => {
    const start = localDayStart('2026-03-29', LONDON);
    const next = localDayStart('2026-03-30', LONDON);
    expect(start.toISOString()).toBe('2026-03-29T00:00:00.000Z');
    // A 23-hour day.
    expect(next.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000);
  });
});

describe('localMinuteOfDay', () => {
  it('converts a UTC instant to London wall-clock minutes', () => {
    expect(localMinuteOfDay(new Date('2026-07-01T07:00:00Z'), LONDON)).toBe(
      8 * 60,
    );
    expect(localMinuteOfDay(new Date('2026-01-15T07:00:00Z'), LONDON)).toBe(
      7 * 60,
    );
  });
});
