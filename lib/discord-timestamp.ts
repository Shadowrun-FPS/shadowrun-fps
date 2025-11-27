/**
 * Converts a Date or timestamp to Discord timestamp format
 * @param date - Date object or timestamp in milliseconds
 * @param style - Discord timestamp style (default: 'R' for relative)
 * @returns Discord timestamp string like <t:1234567890:R>
 */
export function toDiscordTimestamp(
  date: Date | number,
  style: "t" | "T" | "d" | "D" | "f" | "F" | "R" = "R"
): string {
  const timestamp = typeof date === "number" ? date : Math.floor(date.getTime() / 1000);
  return `<t:${timestamp}:${style}>`;
}

/**
 * Gets the original duration from a duration string
 * Extracts the number and unit (e.g., "7 days" from "7 days" or "7 Days")
 */
export function parseDuration(duration: string): { value: number; unit: string } | null {
  if (!duration || duration === "Permanent") {
    return null;
  }

  const match = duration.match(/(\d+)\s*(\w+)/i);
  if (match) {
    return {
      value: parseInt(match[1], 10),
      unit: match[2].toLowerCase(),
    };
  }

  return null;
}

/**
 * Formats duration for display
 */
export function formatDuration(duration: string): string {
  if (!duration || duration === "Permanent") {
    return "Permanent";
  }

  // Normalize the duration string
  const parsed = parseDuration(duration);
  if (parsed) {
    return `${parsed.value} ${parsed.unit}${parsed.value !== 1 ? "" : ""}`;
  }

  return duration;
}

