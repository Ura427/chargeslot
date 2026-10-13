import type { ConnectorType } from '../generated/prisma/client.js';
import { isWithinOpeningHours, type OpeningHours } from './opening-hours.js';
import { SLOT_MINUTES } from './slots.js';

const SLOT_MS = SLOT_MINUTES * 60_000;
const LOOKAHEAD_SLOTS = (24 * 60) / SLOT_MINUTES;

interface StationWithChargers extends OpeningHours {
  chargers: { id: string; connectorType: ConnectorType; powerKw: number }[];
}

interface ActiveReservation {
  chargerId: string;
  slotStart: Date;
}

export interface StationSummary {
  maxPowerKw: number;
  connectorTypes: ConnectorType[];
  // Start of the first bookable slot in the next 24h with a free charger, or null.
  nextFreeAt: string | null;
  freeChargersAtNext: number;
}

// `reservations` are this station's active reservations from `now` on.
export function summarizeStation(
  station: StationWithChargers,
  reservations: ActiveReservation[],
  now: Date,
): StationSummary {
  const taken = new Set(
    reservations.map((r) => `${r.chargerId}|${r.slotStart.getTime()}`),
  );
  const firstSlot = Math.floor(now.getTime() / SLOT_MS) * SLOT_MS + SLOT_MS;

  let nextFreeAt: string | null = null;
  let freeChargersAtNext = 0;
  for (let i = 0; i < LOOKAHEAD_SLOTS; i++) {
    const slotMs = firstSlot + i * SLOT_MS;
    if (!isWithinOpeningHours(station, new Date(slotMs))) continue;
    const free = station.chargers.filter(
      (c) => !taken.has(`${c.id}|${slotMs}`),
    ).length;
    if (free > 0) {
      nextFreeAt = new Date(slotMs).toISOString();
      freeChargersAtNext = free;
      break;
    }
  }

  return {
    maxPowerKw: Math.max(0, ...station.chargers.map((c) => c.powerKw)),
    connectorTypes: [
      ...new Set(station.chargers.map((c) => c.connectorType)),
    ].sort(),
    nextFreeAt,
    freeChargersAtNext,
  };
}
