import type { MarketSession } from './types';

// Compute MarketSession from a wall-clock instant projected onto NY local time.
//
// Windows (ET):
//   pre-market   04:00 – 09:30
//   open         09:30 – 12:00
//   lunch        12:00 – 13:00
//   close        15:30 – 16:00
//   after-hours  16:00 – 20:00
//   closed       weekends, and 20:00 – 04:00
//
// We use `Intl.DateTimeFormat` with `America/New_York` to read the ET hour/minute
// without dragging in a tz library.

const NY_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  hour12: false,
});

export function getSession(now: Date = new Date()): MarketSession {
  const parts = NY_FMT.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const mins = hour * 60 + minute;

  if (weekday === 'Sat' || weekday === 'Sun') return 'closed';

  if (mins < 4 * 60) return 'closed';
  if (mins < 9 * 60 + 30) return 'pre-market';
  if (mins < 12 * 60) return 'open';
  if (mins < 13 * 60) return 'lunch';
  if (mins < 15 * 60 + 30) return 'open';
  if (mins < 16 * 60) return 'close';
  if (mins < 20 * 60) return 'after-hours';
  return 'closed';
}
