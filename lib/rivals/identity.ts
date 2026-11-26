import { namesMatch } from "@/lib/leaderboard-stats";

interface NamedPlayer {
  id: string;
  name: string;
}

/**
 * Picks one roster player from Discord names, in priority order.
 * A name that matches several players is skipped so the next name can still match.
 */
export function uniquePlayerByNames<T extends NamedPlayer>(
  players: readonly T[],
  sessionNames: ReadonlyArray<string | null | undefined>,
): T | null {
  const seen = new Set<string>();
  for (const raw of sessionNames) {
    const name = raw?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const matches = players.filter((player) => namesMatch(player.name, name));
    if (matches.length === 1) return matches[0] ?? null;
  }
  return null;
}
