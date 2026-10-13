import { describe, expect, it } from 'vitest';
import { isWithinOpeningHours } from './opening-hours.js';

const hours = {
  timeZone: 'UTC',
  opensAtMinute: 8 * 60,
  closesAtMinute: 20 * 60,
};

describe('isWithinOpeningHours', () => {
  it('treats a station with no hours as open 24/7', () => {
    const allDay = {
      timeZone: 'UTC',
      opensAtMinute: null,
      closesAtMinute: null,
    };
    expect(isWithinOpeningHours(allDay, new Date('2026-10-01T03:00:00Z'))).toBe(
      true,
    );
  });

  it.each([
    ['07:30', false],
    ['08:00', true],
    ['19:30', true], // last slot ends exactly at closing
    ['20:00', false],
  ])('slot at %s UTC is bookable: %s', (time, expected) => {
    const slot = new Date(`2026-10-01T${time}:00Z`);
    expect(isWithinOpeningHours(hours, slot)).toBe(expected);
  });

  it('reads opening hours as local time at the station', () => {
    const london = { ...hours, timeZone: 'Europe/London' };
    // 08:00 in London during BST is 07:00 UTC.
    expect(isWithinOpeningHours(london, new Date('2026-07-01T07:00:00Z'))).toBe(
      true,
    );
    expect(isWithinOpeningHours(london, new Date('2026-07-01T06:30:00Z'))).toBe(
      false,
    );
  });
});
