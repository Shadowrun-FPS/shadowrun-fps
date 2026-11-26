import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/client-utils";
import {
  MAX_PINNED_PAIRS,
  MAX_SEEN_EVENTS,
  MAX_SEEN_MATCHES,
  MAX_SEEN_PLAYERS,
  PLAYER_ID_PATTERN,
  RIVALS_STORAGE_KEY,
} from "@/lib/rivals/config";
import { canonicalPairKey } from "@/lib/rivals/pairs";
import type { RivalsPreference, SeenSnapshot } from "@/types/rivals";

export function emptyRivalsPreference(): RivalsPreference {
  return {
    version: 1,
    selectedPlayerId: null,
    pinnedPairKeys: [],
    lastSeenByPlayer: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeSeen(value: unknown): SeenSnapshot | null {
  if (!isRecord(value)) return null;
  const matches: Record<string, string> = {};
  if (isRecord(value.matches)) {
    for (const [matchKey, fingerprint] of Object.entries(value.matches)) {
      if (Object.keys(matches).length >= MAX_SEEN_MATCHES) break;
      const [pairKey, matchId] = matchKey.toLowerCase().split(":");
      if (!pairKey || !matchId || !PLAYER_ID_PATTERN.test(matchId)) continue;
      const parts = pairKey.split("_");
      if (parts.length !== 2) continue;
      const canonical = canonicalPairKey(parts[0], parts[1]);
      if (!canonical) continue;
      if (typeof fingerprint !== "string" || fingerprint.length > 240) continue;
      matches[`${canonical}:${matchId}`] = fingerprint;
    }
  }

  const eventIds: string[] = [];
  if (Array.isArray(value.eventIds)) {
    for (const eventId of value.eventIds) {
      if (eventIds.length >= MAX_SEEN_EVENTS) break;
      if (typeof eventId !== "string" || eventId.length > 180) continue;
      if (!/^[-a-z0-9_:]+$/i.test(eventId)) continue;
      eventIds.push(eventId);
    }
  }

  const mainRivalId =
    typeof value.mainRivalId === "string" && PLAYER_ID_PATTERN.test(value.mainRivalId)
      ? value.mainRivalId.toLowerCase()
      : null;

  return {
    snapshotUpdatedAt:
      typeof value.snapshotUpdatedAt === "string"
        ? value.snapshotUpdatedAt.slice(0, 40)
        : "",
    matches,
    eventIds,
    mainRivalId,
  };
}

export function sanitizeRivalsPreference(value: unknown): RivalsPreference | null {
  if (!isRecord(value)) return null;
  const selectedPlayerId =
    typeof value.selectedPlayerId === "string" &&
    PLAYER_ID_PATTERN.test(value.selectedPlayerId)
      ? value.selectedPlayerId.toLowerCase()
      : null;

  const pinnedPairKeys: string[] = [];
  if (Array.isArray(value.pinnedPairKeys)) {
    for (const key of value.pinnedPairKeys) {
      if (pinnedPairKeys.length >= MAX_PINNED_PAIRS) break;
      if (typeof key !== "string") continue;
      const parts = key.toLowerCase().split("_");
      if (parts.length !== 2) continue;
      const canonical = canonicalPairKey(parts[0], parts[1]);
      if (!canonical || pinnedPairKeys.includes(canonical)) continue;
      pinnedPairKeys.push(canonical);
    }
  }

  const lastSeenByPlayer: Record<string, SeenSnapshot> = {};
  if (isRecord(value.lastSeenByPlayer)) {
    for (const [playerId, seen] of Object.entries(value.lastSeenByPlayer)) {
      if (Object.keys(lastSeenByPlayer).length >= MAX_SEEN_PLAYERS) break;
      if (!PLAYER_ID_PATTERN.test(playerId)) continue;
      const snapshot = sanitizeSeen(seen);
      if (!snapshot) continue;
      lastSeenByPlayer[playerId.toLowerCase()] = snapshot;
    }
  }

  return {
    version: 1,
    selectedPlayerId,
    pinnedPairKeys,
    lastSeenByPlayer,
  };
}

export function preferenceIsEmpty(preference: RivalsPreference): boolean {
  return (
    preference.selectedPlayerId == null &&
    preference.pinnedPairKeys.length === 0 &&
    Object.keys(preference.lastSeenByPlayer).length === 0
  );
}

/**
 * The browser copy wins when it already has a choice. An empty browser
 * adopts the account copy. Neither source is treated as owning the ranked player.
 */
export function mergeRivalsPreferences(
  local: RivalsPreference | null,
  account: RivalsPreference | null,
): RivalsPreference {
  const safeLocal = local ?? emptyRivalsPreference();
  const safeAccount = account ?? emptyRivalsPreference();
  if (preferenceIsEmpty(safeLocal) && !preferenceIsEmpty(safeAccount)) return safeAccount;
  return safeLocal;
}

export function readRivalsPreference(): RivalsPreference {
  const raw = safeLocalStorageGet(RIVALS_STORAGE_KEY);
  if (!raw) return emptyRivalsPreference();
  try {
    return sanitizeRivalsPreference(JSON.parse(raw)) ?? emptyRivalsPreference();
  } catch {
    return emptyRivalsPreference();
  }
}

export function writeRivalsPreference(preference: RivalsPreference): void {
  const sanitized = sanitizeRivalsPreference(preference) ?? emptyRivalsPreference();
  safeLocalStorageSet(RIVALS_STORAGE_KEY, JSON.stringify(sanitized));
}
