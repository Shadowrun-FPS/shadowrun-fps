import { PLAYER_ID_PATTERN } from "@/lib/rivals/config";
import type { CompareQuery, CompareScope, CompareWindow } from "@/types/compare";

import { MAX_COMPARE_PLAYERS } from "@/lib/compare/config";

const WINDOWS = new Set<CompareWindow>(["all", "30d", "7d"]);
const SCOPES = new Set<CompareScope>(["own", "shared"]);

export interface CompareSearchInput {
  players?: string | null;
  window?: string | null;
  map?: string | null;
  mode?: string | null;
  scope?: string | null;
}

export interface CompareSearchContext {
  playerIds?: ReadonlySet<string>;
  maps?: ReadonlySet<string>;
  modes?: readonly string[];
}

export function emptyCompareQuery(): CompareQuery {
  return { playerIds: [], window: "all", map: null, mode: null, scope: "own" };
}

export function parseCompareSearch(
  input: CompareSearchInput,
  context: CompareSearchContext = {},
): CompareQuery {
  const seen = new Set<string>();
  const playerIds: string[] = [];
  for (const part of (input.players ?? "").split(",")) {
    const id = part.trim().toLowerCase();
    if (!PLAYER_ID_PATTERN.test(id) || seen.has(id)) continue;
    if (context.playerIds && !context.playerIds.has(id)) continue;
    seen.add(id);
    playerIds.push(id);
    if (playerIds.length === MAX_COMPARE_PLAYERS) break;
  }

  const window: CompareWindow = WINDOWS.has(input.window as CompareWindow)
    ? (input.window as CompareWindow)
    : "all";
  const scope: CompareScope = SCOPES.has(input.scope as CompareScope)
    ? (input.scope as CompareScope)
    : "own";

  let map = input.map?.trim() ? input.map.trim() : null;
  if (context.maps && map && !context.maps.has(map)) map = null;

  let mode = input.mode?.trim() ? input.mode.trim() : null;
  const modes = context.modes ?? [];
  if (modes.length < 2 || (mode != null && !modes.includes(mode))) mode = null;

  return { playerIds, window, map, mode, scope };
}

export function compareHref(query: CompareQuery): string {
  const params = new URLSearchParams();
  if (query.playerIds.length > 0) params.set("players", query.playerIds.join(","));
  if (query.window !== "all") params.set("window", query.window);
  if (query.map) params.set("map", query.map);
  if (query.mode) params.set("mode", query.mode);
  if (query.scope !== "own") params.set("scope", query.scope);
  const search = params.toString();
  return search ? `/leaderboard/compare?${search}` : "/leaderboard/compare";
}

export function filterSummary(query: CompareQuery): string {
  const windowLabel =
    query.window === "7d"
      ? "Last 7 days"
      : query.window === "30d"
        ? "Last 30 days"
        : "All recorded history";
  const parts = [windowLabel, query.map ?? "All maps"];
  if (query.mode) parts.push(query.mode);
  parts.push(query.scope === "shared" ? "Shared matches only" : "Each player's matches");
  return parts.join(" · ");
}

export function activeFilterCount(query: CompareQuery): number {
  let count = 0;
  if (query.window !== "all") count += 1;
  if (query.map) count += 1;
  if (query.mode) count += 1;
  if (query.scope !== "own") count += 1;
  return count;
}

export function queriesEqual(left: CompareQuery, right: CompareQuery): boolean {
  return (
    left.window === right.window &&
    left.map === right.map &&
    left.mode === right.mode &&
    left.scope === right.scope &&
    left.playerIds.length === right.playerIds.length &&
    left.playerIds.every((id, index) => id === right.playerIds[index])
  );
}
