import { SLOT_MINUTES } from './slots.js';
import { localMinuteOfDay } from './time-zone.js';

export interface OpeningHours {
  // IANA zone the hours are read in, e.g. Europe/London.
  timeZone: string;
  // Local minutes after midnight. Both null means open 24/7.
  opensAtMinute: number | null;
  closesAtMinute: number | null;
}

// A slot is bookable only if it starts at or after opening and ends by closing.
export function isWithinOpeningHours(
  hours: OpeningHours,
  slotStart: Date,
): boolean {
  if (hours.opensAtMinute === null || hours.closesAtMinute === null) {
    return true;
  }
  const minute = localMinuteOfDay(slotStart, hours.timeZone);
  return (
    minute >= hours.opensAtMinute &&
    minute + SLOT_MINUTES <= hours.closesAtMinute
  );
}
