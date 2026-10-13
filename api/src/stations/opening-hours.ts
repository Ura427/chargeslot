import { SLOT_MINUTES } from './slots.js';

export interface OpeningHours {
  // Minutes after midnight UTC. Both null means open 24/7.
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
  const minute = slotStart.getUTCHours() * 60 + slotStart.getUTCMinutes();
  return (
    minute >= hours.opensAtMinute &&
    minute + SLOT_MINUTES <= hours.closesAtMinute
  );
}
