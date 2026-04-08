import { formatDistanceToNow } from "date-fns";

/**
 * Primary line: browser locale (date + time). Secondary: ISO-like local stamp for clarity across regions.
 */
export function formatModerationLogDateParts(isoOrDate: string | Date): {
  dateTimeAttr: string;
  primary: string;
  secondary: string;
  relative: string;
} {
  const d =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const dateTimeAttr = Number.isNaN(d.getTime())
    ? ""
    : d.toISOString();

  const primary = Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);

  const secondary = Number.isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const relative = Number.isNaN(d.getTime())
    ? ""
    : formatDistanceToNow(d, { addSuffix: true });

  return { dateTimeAttr, primary, secondary, relative };
}
