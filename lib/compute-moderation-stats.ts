type BanUnbanRow = {
  action?: string;
  playerId?: string;
  timestamp?: Date | string;
  expiry?: Date | string | null;
};

/** Latest unban time per player (ms) from all ban/unban rows. */
export function buildLatestUnbanTimestampByPlayerId(
  rows: BanUnbanRow[],
): Map<string, number> {
  const unbanMap = new Map<string, number>();
  for (const log of rows) {
    if (log.action === "unban" && log.playerId) {
      const t = new Date(log.timestamp as Date).getTime();
      const prev = unbanMap.get(log.playerId);
      if (!prev || t > prev) {
        unbanMap.set(log.playerId, t);
      }
    }
  }
  return unbanMap;
}

export function banLogIsStillActive(
  log: BanUnbanRow,
  unbanMap: Map<string, number>,
): boolean {
  if (log.action !== "ban" || !log.playerId) return false;
  const banTs = new Date(log.timestamp as Date).getTime();
  const unbanTs = unbanMap.get(log.playerId);
  if (unbanTs && unbanTs > banTs) return false;
  if (log.expiry && new Date(log.expiry as Date) < new Date()) return false;
  return true;
}

/** Ban documents that are still in effect (full DB ban+unban history required). */
export function getActiveBanDocuments<T extends BanUnbanRow>(rows: T[]): T[] {
  const unbanMap = buildLatestUnbanTimestampByPlayerId(rows);
  return rows.filter(
    (log) => log.action === "ban" && banLogIsStillActive(log, unbanMap),
  );
}

/**
 * Derive active ban count from ban + unban log rows (same rules as admin moderation UI).
 */
export function computeActiveBansFromBanUnbanRows(rows: BanUnbanRow[]): number {
  return getActiveBanDocuments(rows).length;
}
