const MATCH_TIME_ZONE = "America/Los_Angeles";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: MATCH_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: MATCH_TIME_ZONE,
});

const axisDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: MATCH_TIME_ZONE,
});

const axisDateYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: MATCH_TIME_ZONE,
});

const axisTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: MATCH_TIME_ZONE,
});

const axisDayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: MATCH_TIME_ZONE,
});

const axisYearFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  timeZone: MATCH_TIME_ZONE,
});

/**
 * Formats a match timestamp like "Nov 8, 2026, 9:30 PM".
 *
 * Date and time are formatted separately and joined by hand because
 * `dateStyle`/`timeStyle` join them differently across engines ("at" vs ","),
 * and newer ICU builds use a narrow no-break space before AM/PM. Either
 * difference causes server/client hydration mismatches.
 */
export function formatMatchDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const time = timeFormatter.format(date).replace(/[\u202f\u00a0]/g, " ");

  return `${dateFormatter.format(date)}, ${time}`;
}

/**
 * Formats a timestamp in the visitor's local timezone, e.g.
 * "Nov 23, 2026, 7:30 PM EST". Call from the client after mount so SSR
 * does not bake in the server's timezone.
 */
export function formatLocalDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
    .format(date)
    .replace(/[\u202f\u00a0]/g, " ");

  return `${datePart}, ${timePart}`;
}

function cleanAxisLabel(value: string): string {
  return value.replace(/[\u202f\u00a0]/g, " ");
}

/** Calendar day in the match timezone, suitable for comparing two timestamps. */
export function matchDayKey(timestampMs: number): string {
  return axisDayKeyFormatter.format(timestampMs);
}

/** Compact chart label: a clock time, or a month and day. */
export function formatMatchAxisLabel(timestampMs: number, sameDay: boolean, withYear: boolean): string {
  const date = new Date(timestampMs);
  if (sameDay) return cleanAxisLabel(axisTimeFormatter.format(date));
  return withYear ? axisDateYearFormatter.format(date) : axisDateFormatter.format(date);
}

/** A short range such as "Nov 16–Nov 22, 2026" or a single day. */
export function formatMatchSpan(startMs: number, endMs: number): string {
  const startDay = axisDateFormatter.format(startMs);
  const endDay = axisDateFormatter.format(endMs);
  const startYear = axisYearFormatter.format(startMs);
  const endYear = axisYearFormatter.format(endMs);
  if (matchDayKey(startMs) === matchDayKey(endMs)) return `${startDay}, ${endYear}`;
  if (startYear !== endYear) return `${startDay}, ${startYear}–${endDay}, ${endYear}`;
  return `${startDay}–${endDay}, ${endYear}`;
}
