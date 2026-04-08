/**
 * Normalize Discord snowflake IDs from MongoDB / JSON (string, number, Long, BigInt).
 */
export function normalizeDiscordSnowflake(id: unknown): string | null {
  if (id == null) return null;
  if (typeof id === "string") {
    const t = id.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof id === "bigint") {
    return id.toString();
  }
  if (typeof id === "number" && Number.isFinite(id)) {
    return String(Math.trunc(id));
  }
  if (typeof id === "object" && id !== null && "toString" in id) {
    try {
      const ts = (id as { toString(): string }).toString();
      if (/^\d+$/.test(ts)) return ts;
    } catch {
      /* ignore */
    }
  }
  const s = String(id).trim();
  return s.length > 0 ? s : null;
}

export function normalizeDiscordSnowflakeList(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  for (const id of ids) {
    const n = normalizeDiscordSnowflake(id);
    if (n) out.push(n);
  }
  return out;
}

/** Discord snowflakes are numeric strings, typically 17–22 digits. */
export function looksLikeDiscordSnowflakeId(value: string): boolean {
  return /^\d{17,22}$/.test(value.trim());
}
