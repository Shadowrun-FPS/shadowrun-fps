export type ParsedChangelogNote =
  | {
      type: "structured";
      category: string;
      title: string;
      description: string;
    }
  | { type: "fallback"; raw: string };

/**
 * Parses launcher changelog lines shaped like:
 * `**Added:** **Feature Name** - Longer description...`
 */
export function parseChangelogNote(note: string): ParsedChangelogNote {
  const trimmed = note.trim();
  const m = trimmed.match(
    /^\*\*(Added|Improved|Fixed|Changed|Removed):\*\*\s*\*\*(.+?)\*\*\s*-\s*([\s\S]+)$/i
  );
  if (m) {
    const rawCat = m[1];
    const category =
      rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
    return {
      type: "structured",
      category,
      title: m[2].trim(),
      description: m[3].trim(),
    };
  }
  return { type: "fallback", raw: trimmed };
}
