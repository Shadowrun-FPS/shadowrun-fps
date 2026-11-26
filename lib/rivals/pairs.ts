import type { LeaderboardPayload } from "@/types/leaderboard";
import type {
  EncounterResult,
  MapSeriesRecord,
  RivalEncounter,
  RivalIndex,
  RivalPlayerRef,
  RivalSeat,
  RivalSeries,
  RivalSource,
  RivalSourceMatch,
  RivalSourceSeat,
  SeriesRecord,
  SeriesStreak,
} from "@/types/rivals";
import {
  CLOSE_MARGIN,
  DAY_MS,
  PLAYER_ID_PATTERN,
  RECENT_WINDOW_MS,
} from "@/lib/rivals/config";

export function canonicalPairKey(leftId: string, rightId: string): string | null {
  const left = leftId.toLowerCase();
  const right = rightId.toLowerCase();
  if (!PLAYER_ID_PATTERN.test(left) || !PLAYER_ID_PATTERN.test(right)) return null;
  if (left === right) return null;
  return left < right ? `${left}_${right}` : `${right}_${left}`;
}

export function parsePairParam(
  raw: string,
): { key: string; playerIds: [string, string] } | null {
  const parts = raw.toLowerCase().split("_");
  if (parts.length !== 2) return null;
  const key = canonicalPairKey(parts[0], parts[1]);
  if (!key) return null;
  const [low, high] = key.split("_");
  return { key, playerIds: [low, high] };
}

export function parseTimestamp(iso: string): number | null {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function resolveAsOfMs(
  updatedAt: string,
  matches: Array<{ finishedAt: string }>,
): number {
  const updated = parseTimestamp(updatedAt);
  if (updated != null) return updated;
  let newest = 0;
  for (const match of matches) {
    const ms = parseTimestamp(match.finishedAt);
    if (ms != null && ms > newest) newest = ms;
  }
  return newest;
}

export function dedupeMatches(matches: RivalSourceMatch[]): RivalSourceMatch[] {
  const byId = new Map<string, { match: RivalSourceMatch; index: number }>();

  matches.forEach((match, index) => {
    if (!match || typeof match.id !== "string") return;
    const id = match.id.toLowerCase();
    if (!PLAYER_ID_PATTERN.test(id)) return;
    const previous = byId.get(id);
    if (!previous) {
      byId.set(id, { match: { ...match, id }, index });
      return;
    }
    const previousMs = parseTimestamp(previous.match.finishedAt) ?? Number.NEGATIVE_INFINITY;
    const nextMs = parseTimestamp(match.finishedAt) ?? Number.NEGATIVE_INFINITY;
    if (nextMs > previousMs || (nextMs === previousMs && index > previous.index)) {
      byId.set(id, { match: { ...match, id }, index });
    }
  });

  return [...byId.values()]
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.match);
}

function seatsForMatch(players: RivalSourceSeat[]): RivalSeat[] {
  const byId = new Map<string, RivalSeat | "conflict">();

  for (const player of players) {
    if (!player || typeof player.id !== "string") continue;
    const id = player.id.toLowerCase();
    if (!PLAYER_ID_PATTERN.test(id)) continue;
    if (player.team !== 0 && player.team !== 1) continue;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, {
        id,
        team: player.team,
        stats: player.stats ?? null,
      });
      continue;
    }
    if (existing !== "conflict" && existing.team !== player.team) {
      byId.set(id, "conflict");
    }
  }

  const seats: RivalSeat[] = [];
  for (const seat of byId.values()) {
    if (seat !== "conflict") seats.push(seat);
  }
  return seats;
}

function compareEncounters(left: RivalEncounter, right: RivalEncounter): number {
  if (left.finishedAtMs !== right.finishedAtMs) {
    return left.finishedAtMs - right.finishedAtMs;
  }
  if (left.number !== right.number) return left.number - right.number;
  return left.matchId.localeCompare(right.matchId);
}

export function buildRivalIndex(source: RivalSource): RivalIndex {
  const matches = dedupeMatches(source.matches);
  const players = new Map<string, RivalPlayerRef>();

  for (const player of source.players) {
    if (!player || typeof player.id !== "string") continue;
    const id = player.id.toLowerCase();
    if (!PLAYER_ID_PATTERN.test(id)) continue;
    const name = player.name.trim();
    if (!name) continue;
    players.set(id, {
      id,
      name,
      tier: player.tier,
    });
  }

  const seriesByKey = new Map<string, RivalSeries>();

  for (const match of matches) {
    const finishedAtMs = parseTimestamp(match.finishedAt) ?? 0;
    const decisive =
      match.winningTeam === 0
        ? match.score[0] > match.score[1]
        : match.winningTeam === 1
          ? match.score[1] > match.score[0]
          : false;
    const seats = seatsForMatch(match.players);
    const teamZero = seats.filter((seat) => seat.team === 0);
    const teamOne = seats.filter((seat) => seat.team === 1);

    for (const seat of seats) {
      if (!players.has(seat.id)) {
        const named = match.players.find(
          (player) => player.id.toLowerCase() === seat.id,
        );
        players.set(seat.id, {
          id: seat.id,
          name: named?.name?.trim() || "Unknown",
        });
      }
    }

    for (const left of teamZero) {
      for (const right of teamOne) {
        const pairKey = canonicalPairKey(left.id, right.id);
        if (!pairKey) continue;
        const [low, high] = pairKey.split("_") as [string, string];
        const encounter: RivalEncounter = {
          matchId: match.id,
          finishedAt: match.finishedAt,
          finishedAtMs,
          map: match.map,
          mode: match.mode,
          number: match.number,
          score: match.score,
          decisive,
          winningTeam: decisive ? match.winningTeam : null,
          seats: left.id === low ? [left, right] : [right, left],
        };
        const existing = seriesByKey.get(pairKey);
        if (existing) {
          existing.encounters.push(encounter);
        } else {
          seriesByKey.set(pairKey, {
            pairKey,
            playerIds: [low, high],
            encounters: [encounter],
          });
        }
      }
    }
  }

  for (const series of seriesByKey.values()) {
    series.encounters.sort(compareEncounters);
  }

  const pairKeysByPlayer = new Map<string, string[]>();
  for (const series of seriesByKey.values()) {
    for (const playerId of series.playerIds) {
      const keys = pairKeysByPlayer.get(playerId);
      if (keys) keys.push(series.pairKey);
      else pairKeysByPlayer.set(playerId, [series.pairKey]);
    }
  }
  for (const keys of pairKeysByPlayer.values()) {
    keys.sort((left, right) => left.localeCompare(right));
  }

  return {
    asOfMs: resolveAsOfMs(source.updatedAt, matches),
    updatedAt: source.updatedAt,
    players,
    seriesByKey,
    pairKeysByPlayer,
    matches,
  };
}

export function rivalIndexFromPayload(payload: LeaderboardPayload): RivalIndex {
  const profiles = [...payload.players, ...(payload.unlistedPlayers ?? [])];
  return buildRivalIndex({
    updatedAt: payload.updatedAt,
    players: profiles.map((player) => ({
      id: player.id,
      name: player.name,
      tier: player.tier,
    })),
    matches: payload.matches.map((match) => ({
      id: match.id,
      finishedAt: match.finishedAt,
      map: match.map,
      mode: match.mode,
      number: match.number,
      score: match.score,
      winningTeam: match.decisive ? match.winningTeam : null,
      players: match.players.map((player) => ({
        id: player.id,
        team: player.team,
        stats: player.stats,
        name: player.name,
      })),
    })),
  });
}

export function opponentIdFor(series: RivalSeries, playerId: string): string {
  return series.playerIds[0] === playerId ? series.playerIds[1] : series.playerIds[0];
}

export function resultFor(encounter: RivalEncounter, playerId: string): EncounterResult {
  const seat = encounter.seats.find((entry) => entry.id === playerId);
  if (!seat || !encounter.decisive || encounter.winningTeam == null) return "unresolved";
  return seat.team === encounter.winningTeam ? "win" : "loss";
}

export function isRecentEncounter(finishedAtMs: number, asOfMs: number): boolean {
  return asOfMs - finishedAtMs <= RECENT_WINDOW_MS;
}

export function encountersInWindow(
  encounters: RivalEncounter[],
  asOfMs: number,
  windowMs: number | null,
): RivalEncounter[] {
  if (windowMs == null) return encounters;
  return encounters.filter((encounter) => asOfMs - encounter.finishedAtMs <= windowMs);
}

export function seriesRecord(
  encounters: RivalEncounter[],
  playerId: string,
): SeriesRecord {
  const record: SeriesRecord = {
    meetings: encounters.length,
    wins: 0,
    losses: 0,
    unresolved: 0,
    decisive: 0,
    close: 0,
    newestMs: 0,
    lastFinishedAt: null,
    lastFive: [],
  };

  for (const encounter of encounters) {
    const result = resultFor(encounter, playerId);
    if (result === "win") record.wins += 1;
    else if (result === "loss") record.losses += 1;
    else record.unresolved += 1;

    if (result !== "unresolved") {
      record.decisive += 1;
      const margin = Math.abs(encounter.score[0] - encounter.score[1]);
      if (margin <= CLOSE_MARGIN) record.close += 1;
    }

    if (encounter.finishedAtMs >= record.newestMs) {
      record.newestMs = encounter.finishedAtMs;
      record.lastFinishedAt = encounter.finishedAt;
    }
  }

  record.lastFive = encounters
    .slice(-5)
    .map((encounter) => resultFor(encounter, playerId));
  return record;
}

export function currentStreak(
  encounters: RivalEncounter[],
  playerId: string,
): SeriesStreak {
  let kind: SeriesStreak["kind"] = "none";
  let length = 0;

  for (let index = encounters.length - 1; index >= 0; index -= 1) {
    const result = resultFor(encounters[index], playerId);
    if (result === "unresolved") continue;
    if (kind === "none") {
      kind = result;
      length = 1;
      continue;
    }
    if (result !== kind) break;
    length += 1;
  }

  return { kind, length };
}

export function mapRecords(
  encounters: RivalEncounter[],
  playerId: string,
): MapSeriesRecord[] {
  const byMap = new Map<string, MapSeriesRecord>();

  for (const encounter of encounters) {
    const current = byMap.get(encounter.map) ?? {
      map: encounter.map,
      meetings: 0,
      wins: 0,
      losses: 0,
      unresolved: 0,
    };
    current.meetings += 1;
    const result = resultFor(encounter, playerId);
    if (result === "win") current.wins += 1;
    else if (result === "loss") current.losses += 1;
    else current.unresolved += 1;
    byMap.set(encounter.map, current);
  }

  return [...byMap.values()].sort((left, right) => {
    if (right.meetings !== left.meetings) return right.meetings - left.meetings;
    return left.map.localeCompare(right.map);
  });
}

export function formatSeriesScore(wins: number, losses: number): string {
  return `${wins}–${losses}`;
}

export function formatEncounterScore(
  encounter: RivalEncounter,
  playerId: string,
): string {
  const seat = encounter.seats.find((entry) => entry.id === playerId);
  if (!seat) return `${encounter.score[0]}–${encounter.score[1]}`;
  const opponentTeam = seat.team === 0 ? 1 : 0;
  return `${encounter.score[seat.team]}–${encounter.score[opponentTeam]}`;
}

export function daysBetween(earlierMs: number, laterMs: number): number {
  return Math.max(0, (laterMs - earlierMs) / DAY_MS);
}

export function playerName(index: RivalIndex, playerId: string): string {
  return index.players.get(playerId)?.name ?? "Unknown";
}
