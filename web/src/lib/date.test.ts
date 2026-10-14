import {
  dayPart,
  formatOpeningHours,
  formatStationTime,
  stationDateString,
  zoneAbbreviation,
} from './date';

const LONDON = 'Europe/London';

describe('stationDateString', () => {
  it('uses the calendar day at the station, not UTC', () => {
    // 23:30 UTC on 1 July is already 2 July in London (BST).
    const now = new Date('2026-07-01T23:30:00Z');
    expect(stationDateString(0, LONDON, now)).toBe('2026-07-02');
    expect(stationDateString(1, LONDON, now)).toBe('2026-07-03');
  });
});

describe('formatStationTime', () => {
  it('shows wall-clock time at the station', () => {
    expect(formatStationTime('2026-07-01T07:00:00Z', LONDON)).toBe('08:00');
  });
});

describe('dayPart', () => {
  it.each([
    ['2026-07-01T05:30:00Z', 'Morning'], // 06:30 local
    ['2026-07-01T11:00:00Z', 'Afternoon'], // 12:00
    ['2026-07-01T16:00:00Z', 'Evening'], // 17:00
    ['2026-07-01T22:30:00Z', 'Evening'], // 23:30
  ])('%s is %s in London', (iso, part) => {
    expect(dayPart(iso, LONDON)).toBe(part);
  });
});

describe('formatOpeningHours', () => {
  it('says 24/7 when there are no hours', () => {
    expect(formatOpeningHours(null, null)).toBe('Open 24/7');
  });

  it('formats local minutes as HH:MM', () => {
    expect(formatOpeningHours(8 * 60, 22 * 60)).toBe('08:00–22:00');
  });
});

describe('zoneAbbreviation', () => {
  it('names the zone for that date', () => {
    expect(zoneAbbreviation('2026-07-01T12:00:00Z', LONDON)).toBe('BST');
    expect(zoneAbbreviation('2026-01-15T12:00:00Z', LONDON)).toBe('GMT');
  });
});
