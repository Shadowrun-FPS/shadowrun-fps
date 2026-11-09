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
