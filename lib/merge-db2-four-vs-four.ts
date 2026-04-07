/**
 * Merge ShadowrunDB2 ladder 4v4 stats into a ShadowrunWeb Players.stats entry.
 * DB2 is authoritative for ELO / W–L on the 4v4 ladder, but it may omit lastMatchDate;
 * in that case we must keep Web's date so the profile activity window on the stats page works.
 */
type WebStatSlice = {
  teamSize: number;
  lastMatchDate?: unknown;
};

export type Db2PlayerSlice = {
  rating: number;
  wins?: number;
  losses?: number;
  lastMatchDate?: unknown;
};

/** Narrow a Mongo `players` document from ShadowrunDB2 for merge (avoids unsafe casts in routes). */
export function db2PlayerDocToSlice(
  doc: unknown
): Db2PlayerSlice | null {
  if (!doc || typeof doc !== "object") return null;
  const d = doc as {
    rating?: unknown;
    wins?: unknown;
    losses?: unknown;
    lastMatchDate?: unknown;
  };
  const rating = d.rating;
  if (typeof rating !== "number" || Number.isNaN(rating)) return null;
  return {
    rating,
    wins: typeof d.wins === "number" ? d.wins : undefined,
    losses: typeof d.losses === "number" ? d.losses : undefined,
    lastMatchDate: d.lastMatchDate,
  };
}

export function lastMatchTime(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === "object" && value !== null && "$date" in value) {
    const inner = (value as { $date: string | number | Date }).$date;
    const t = new Date(inner).getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === "string" || typeof value === "number") {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

/** Prefer the more recent of DB2 vs Web last-match timestamps when both exist. */
function coalesceLastMatchDate(db2Date: unknown, webDate: unknown): unknown {
  const t2 = lastMatchTime(db2Date);
  const tw = lastMatchTime(webDate);
  if (t2 != null && tw != null) return t2 >= tw ? db2Date : webDate;
  if (t2 != null) return db2Date;
  if (tw != null) return webDate;
  return undefined;
}

export function mergeFourVsFourFromDb2(
  existingWeb: WebStatSlice | undefined,
  db2Player: Db2PlayerSlice
): {
  teamSize: 4;
  elo: number;
  wins: number;
  losses: number;
  lastMatchDate: unknown;
} {
  return {
    teamSize: 4,
    elo: db2Player.rating,
    wins: Number(db2Player.wins ?? 0),
    losses: Number(db2Player.losses ?? 0),
    lastMatchDate: coalesceLastMatchDate(
      db2Player.lastMatchDate,
      existingWeb?.lastMatchDate
    ),
  };
}
