// The API sends UTC instants; calendar days and clock times are shown in the
// station's own IANA zone, because that's where the user will be charging.

export function stationDateString(
  offsetDays: number,
  timeZone: string,
  now: Date = new Date(),
): string {
  // en-CA formats as YYYY-MM-DD.
  const today = now.toLocaleDateString('en-CA', { timeZone });
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function formatStationTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type DayPart = 'Morning' | 'Afternoon' | 'Evening';

export function dayPart(iso: string, timeZone: string): DayPart {
  const hour = Number(
    new Date(iso).toLocaleString('en-GB', {
      timeZone,
      hour: '2-digit',
      hourCycle: 'h23',
    }),
  );
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

const hhmm = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

export function formatOpeningHours(
  opensAtMinute: number | null,
  closesAtMinute: number | null,
): string {
  if (opensAtMinute === null || closesAtMinute === null) return 'Open 24/7';
  return `${hhmm(opensAtMinute)}–${hhmm(closesAtMinute)}`;
}

// Short zone name at that instant, e.g. "BST" or "GMT" for Europe/London.
export function zoneAbbreviation(iso: string, timeZone: string): string {
  return (
    new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'short' })
      .formatToParts(new Date(iso))
      .find((part) => part.type === 'timeZoneName')?.value ?? timeZone
  );
}

export function formatStationDateTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isBrowserTimeZone(timeZone: string): boolean {
  return Intl.DateTimeFormat().resolvedOptions().timeZone === timeZone;
}
