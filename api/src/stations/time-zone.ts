// Wall-clock helpers for IANA time zones, using only Intl (no date library).

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

// How far the zone's wall clock is ahead of UTC at this instant, in ms.
function offsetMs(instant: number, timeZone: string): number {
  const parts: Record<string, number> = {};
  for (const { type, value } of formatter(timeZone).formatToParts(instant)) {
    parts[type] = Number(value);
  }
  const wall = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return wall - Math.floor(instant / 1000) * 1000;
}

// The UTC instant of local midnight on `date` (YYYY-MM-DD) in `timeZone`.
export function localDayStart(date: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const wallMidnight = Date.UTC(y, m - 1, d);
  // Second pass corrects for an offset change between the guess and the answer.
  const guess = wallMidnight - offsetMs(wallMidnight, timeZone);
  return new Date(wallMidnight - offsetMs(guess, timeZone));
}

export function localMinuteOfDay(instant: Date, timeZone: string): number {
  const wall = instant.getTime() + offsetMs(instant.getTime(), timeZone);
  const minute = Math.floor(wall / 60_000) % (24 * 60);
  return minute < 0 ? minute + 24 * 60 : minute;
}
