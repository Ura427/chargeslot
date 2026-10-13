import { describe, expect, it } from 'vitest';
import { isWithinOpeningHours } from './opening-hours.js';

const hours = { opensAtMinute: 8 * 60, closesAtMinute: 20 * 60 };

describe('isWithinOpeningHours', () => {
  it('treats a station with no hours as open 24/7', () => {
    const allDay = { opensAtMinute: null, closesAtMinute: null };
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
});
