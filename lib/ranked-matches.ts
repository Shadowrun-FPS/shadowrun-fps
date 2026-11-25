import { getRankedSnapshot } from "@/lib/leaderboard";
import { resolveRankedMap } from "@/lib/match-maps";
import { cachedQuery } from "@/lib/query-cache";
import { safeLog, sanitizeString } from "@/lib/security";
import {
  RANKED_PUBLIC_SCHEMA,
  type MatchFormat,
  type MatchScoreboardPlayer,
  type RankedAccuracyStats,
  type RankedArtifactStats,
  type RankedCombatStats,
  type RankedFriendlyFireStats,
  type RankedMatchGame,
  type RankedMatchSeries,
  type RankedMatchesPayload,
  type RankedMoneyColumns,
  type RankedPlayerScoreboard,
  type RankedRoundEndStats,
  type RankedStatSummary,
  type RankedTeamId,
  type RankedTeamPlayStats,
} from "@/types";

const CACHE_TTL_MS = 60_000;
const CACHE_KEY = "matches:public:v4";
const MAX_PLAYERS = 5_000;
const MAX_MATCHES = 500;
const MAX_MATCH_PLAYERS = 16;
const MAX_NAME_LENGTH = 64;
const MAX_SERIES_ID_LENGTH = 64;
const PLAYER_ID_PATTERN = /^[a-f0-9]{24}$/i;

interface SnapshotPlayer {
  id: unknown;
  name: unknown;
}

interface SnapshotMatchPlayer {
  eloBefore: unknown;
  eloChange: unknown;
  id: unknown;
  performanceUsed: unknown;
  scoreboard: unknown;
  team: unknown;
}

interface SnapshotMatch {
  finishedAt: unknown;
  format?: unknown;
  gameNumber?: unknown;
  id: unknown;
  map: unknown;
  mode: unknown;
  number: unknown;
  players: unknown;
  score: unknown;
  series?: unknown;
  seriesFormat?: unknown;
  seriesId?: unknown;
  winningTeam: unknown;
}

interface Snapshot {
  matches: unknown;
  players: unknown;
  schema: unknown;
  updatedAt: unknown;
}

interface PendingGame {
  game: RankedMatchGame;
  seriesId: string | null;
  explicitFormat: MatchFormat | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asCount(value: unknown): number | null {
  if (!isFiniteNumber(value)) return null;
  return Math.max(0, Math.trunc(value));
}

function asNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readRequiredCounts(
  source: Record<string, unknown>,
  keys: string[],
): number[] | null {
  const values: number[] = [];
  for (const key of keys) {
    const value = asCount(source[key]);
    if (value == null) return null;
    values.push(value);
  }
  return values;
}

function readRequiredNumbers(
  source: Record<string, unknown>,
  keys: string[],
): number[] | null {
  const values: number[] = [];
  for (const key of keys) {
    const value = asNumber(source[key]);
    if (value == null) return null;
    values.push(value);
  }
  return values;
}

function parseStatSummary(value: unknown): RankedStatSummary | null {
  const source = asRecord(value);
  if (!source) return null;
  const counts = readRequiredCounts(source, ["deaths", "kills", "resurrects"]);
  const money = readRequiredNumbers(source, ["bonus_total", "friendly_fire_total"]);
  if (!counts || !money) return null;
  return {
    deaths: counts[0],
    kills: counts[1],
    resurrects: counts[2],
    bonus_total: money[0],
    friendly_fire_total: money[1],
  };
}

function parseCombat(value: unknown): RankedCombatStats | null {
  const source = asRecord(value);
  if (!source) return null;
  const kills = asCount(source.kills);
  const percents = readRequiredNumbers(source, [
    "body_clear_percent",
    "damage_percent",
  ]);
  const total = asNumber(source.combat_total);
  if (kills == null || !percents || total == null) return null;
  return {
    kills,
    body_clear_percent: percents[0],
    damage_percent: percents[1],
    combat_total: total,
  };
}

function parseAccuracy(value: unknown): RankedAccuracyStats | null {
  const source = asRecord(value);
  if (!source) return null;
  const hitPercent = asNumber(source.hit_percent);
  const shots = readRequiredCounts(source, ["shots_fired", "shots_hit"]);
  if (hitPercent == null || !shots) return null;
  return {
    hit_percent: hitPercent,
    shots_fired: shots[0],
    shots_hit: shots[1],
  };
}

function parseArtifact(value: unknown): RankedArtifactStats | null {
  const source = asRecord(value);
  if (!source) return null;
  const counts = readRequiredCounts(source, ["pickups", "scores"]);
  const total = asNumber(source.artifact_total);
  const carry = asNumber(source.carry_percent);
  if (!counts || total == null || carry == null) return null;
  return {
    pickups: counts[0],
    scores: counts[1],
    artifact_total: total,
    carry_percent: carry,
  };
}

function parseTeamPlay(value: unknown): RankedTeamPlayStats | null {
  const source = asRecord(value);
  if (!source) return null;
  const resurrects = asCount(source.resurrects);
  const healing = asNumber(source.healing_percent);
  const extra = asNumber(source.res_extra_money);
  const total = asNumber(source.team_play_total);
  if (resurrects == null || healing == null || extra == null || total == null) {
    return null;
  }
  return {
    resurrects,
    healing_percent: healing,
    res_extra_money: extra,
    team_play_total: total,
  };
}

function parseFriendlyFire(value: unknown): RankedFriendlyFireStats | null {
  const source = asRecord(value);
  if (!source) return null;
  const penalties = asCount(source.penalties);
  const damage = asNumber(source.damage_percent);
  const total = asNumber(source.friendly_fire_total);
  if (penalties == null || damage == null || total == null) return null;
  return {
    penalties,
    damage_percent: damage,
    friendly_fire_total: total,
  };
}

function parseRoundEnd(value: unknown): RankedRoundEndStats | null {
  const source = asRecord(value);
  if (!source) return null;
  const counts = readRequiredCounts(source, ["major_wins", "minor_wins", "rounds"]);
  const money = readRequiredNumbers(source, ["round_end_total", "upkeep_money"]);
  if (!counts || !money) return null;
  return {
    major_wins: counts[0],
    minor_wins: counts[1],
    rounds: counts[2],
    round_end_total: money[0],
    upkeep_money: money[1],
  };
}

function parseMoneyArray(value: unknown, maxLength: number): number[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxLength).map((entry) => asNumber(entry) ?? 0);
}

function parseMoneyColumns(value: unknown): RankedMoneyColumns | null {
  const source = asRecord(value);
  if (!source) return null;
  const columns: RankedMoneyColumns = {
    artifact: parseMoneyArray(source.artifact, 8),
    combat: parseMoneyArray(source.combat, 8),
    friendly_fire: parseMoneyArray(source.friendly_fire, 8),
    round_end: parseMoneyArray(source.round_end, 8),
    team_play: parseMoneyArray(source.team_play, 8),
  };
  const hasAny = Object.values(columns).some((column) => column.length > 0);
  return hasAny ? columns : null;
}

export function parsePlayerScoreboard(value: unknown): RankedPlayerScoreboard | null {
  const source = asRecord(value);
  if (!source) return null;

  const scoreboard: RankedPlayerScoreboard = {
    stat_summary: parseStatSummary(source.stat_summary),
    combat: parseCombat(source.combat),
    accuracy: parseAccuracy(source.accuracy),
    artifact: parseArtifact(source.artifact),
    team_play: parseTeamPlay(source.team_play),
    friendly_fire: parseFriendlyFire(source.friendly_fire),
    round_end: parseRoundEnd(source.round_end),
    moneyColumns: parseMoneyColumns(source.moneyColumns),
  };

  const hasSection = Object.values(scoreboard).some((section) => section != null);
  return hasSection ? scoreboard : null;
}

function readFormat(value: unknown): MatchFormat | null {
  if (value === "bo3" || value === "single") return value;
  return null;
}

function readSeriesLink(entry: SnapshotMatch): {
  seriesId: string | null;
  format: MatchFormat | null;
  gameNumber: number | null;
} {
  const record = entry as unknown as Record<string, unknown>;
  const nested = asRecord(record.series);
  const rawId = [record.seriesId, record.series_id, nested?.id].find(
    (value) => typeof value === "string",
  );
  const seriesId =
    typeof rawId === "string"
      ? sanitizeString(rawId, MAX_SERIES_ID_LENGTH) || null
      : null;

  const format =
    readFormat(record.format) ??
    readFormat(record.seriesFormat) ??
    readFormat(record.series_format) ??
    (nested ? readFormat(nested.format) : null);

  const gameNumber = asCount(
    record.gameNumber ?? record.game_number ?? nested?.gameNumber ?? nested?.game_number,
  );

  return { seriesId, format, gameNumber };
}

function teamId(value: unknown): RankedTeamId {
  return value === 1 ? 1 : 0;
}

function buildNames(players: unknown[]): Map<string, string> {
  const names = new Map<string, string>();
  for (const entry of players as SnapshotPlayer[]) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id !== "string" || !PLAYER_ID_PATTERN.test(entry.id)) continue;
    const name = sanitizeString(
      typeof entry.name === "string" ? entry.name : "",
      MAX_NAME_LENGTH,
    );
    if (!name) continue;
    names.set(entry.id.toLowerCase(), name);
  }
  return names;
}

function buildPlayer(
  raw: SnapshotMatchPlayer,
  namesById: Map<string, string>,
): MatchScoreboardPlayer | null {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "string" || !PLAYER_ID_PATTERN.test(raw.id)) return null;

  const id = raw.id.toLowerCase();
  const scoreboard =
    raw.performanceUsed === true ? parsePlayerScoreboard(raw.scoreboard) : null;

  return {
    id,
    name: namesById.get(id) ?? "Unknown",
    team: teamId(raw.team),
    elo: asNumber(raw.eloBefore),
    eloChange: asNumber(raw.eloChange),
    performanceUsed: scoreboard != null,
    scoreboard,
  };
}

function seriesWinner(score: [number, number]): RankedTeamId | null {
  if (score[0] === score[1]) return null;
  return score[1] > score[0] ? 1 : 0;
}

function groupSeries(pending: PendingGame[]): RankedMatchSeries[] {
  const groups = new Map<string, PendingGame[]>();

  for (const entry of pending) {
    const key = entry.seriesId ?? `match:${entry.game.id}`;
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }

  const seriesList: RankedMatchSeries[] = [];

  for (const [key, entries] of groups) {
    const ordered = [...entries].sort((first, second) => {
      const firstNumber = first.game.gameNumber;
      const secondNumber = second.game.gameNumber;
      if (firstNumber !== secondNumber) return firstNumber - secondNumber;
      return first.game.finishedAt.localeCompare(second.game.finishedAt);
    });

    ordered.forEach((entry, index) => {
      if (entry.seriesId) {
        entry.game.gameNumber = index + 1;
      }
    });

    const games = ordered.map((entry) => entry.game);
    const explicitFormat = ordered.find((entry) => entry.explicitFormat)?.explicitFormat ?? null;
    const format: MatchFormat =
      games.length > 1 || explicitFormat === "bo3" ? "bo3" : "single";
    const seriesScore: [number, number] = [0, 0];
    for (const game of games) {
      seriesScore[game.winningTeam] += 1;
    }

    const playedAt = games.reduce(
      (latest, game) => (game.finishedAt > latest ? game.finishedAt : latest),
      games[0]?.finishedAt ?? "",
    );

    seriesList.push({
      id: key.startsWith("match:") ? games[0].id : key,
      format,
      playedAt,
      games,
      seriesScore,
      winner: seriesWinner(seriesScore),
    });
  }

  seriesList.sort((first, second) => second.playedAt.localeCompare(first.playedAt));
  return seriesList;
}

export function normalizeRankedMatches(raw: unknown): RankedMatchesPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Ranked snapshot is empty.");
  }

  const snapshot = raw as Snapshot;
  if (snapshot.schema !== RANKED_PUBLIC_SCHEMA) {
    throw new Error("Ranked snapshot schema is unsupported.");
  }
  if (typeof snapshot.updatedAt !== "string" || !snapshot.updatedAt.trim()) {
    throw new Error("Ranked snapshot is missing updatedAt.");
  }
  if (!Array.isArray(snapshot.players) || !Array.isArray(snapshot.matches)) {
    throw new Error("Ranked snapshot is missing players or matches.");
  }
  if (snapshot.players.length > MAX_PLAYERS || snapshot.matches.length > MAX_MATCHES) {
    throw new Error("Ranked snapshot exceeds size limits.");
  }

  const namesById = buildNames(snapshot.players);
  const pending: PendingGame[] = [];

  for (const entry of snapshot.matches as SnapshotMatch[]) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id !== "string" || !PLAYER_ID_PATTERN.test(entry.id)) continue;
    if (typeof entry.finishedAt !== "string") continue;
    if (!Array.isArray(entry.players) || entry.players.length > MAX_MATCH_PLAYERS) {
      continue;
    }

    const players: MatchScoreboardPlayer[] = [];
    for (const rawPlayer of entry.players as SnapshotMatchPlayer[]) {
      const player = buildPlayer(rawPlayer, namesById);
      if (player) players.push(player);
    }

    const score = Array.isArray(entry.score) ? entry.score : [];
    const mapName = sanitizeString(
      typeof entry.map === "string" ? entry.map : "Unknown",
      64,
    );
    const map = resolveRankedMap(mapName);
    const link = readSeriesLink(entry);
    const finishedAt = sanitizeString(entry.finishedAt, 40);

    pending.push({
      seriesId: link.seriesId,
      explicitFormat: link.format,
      game: {
        id: entry.id.toLowerCase(),
        gameNumber: link.gameNumber && link.gameNumber > 0 ? link.gameNumber : 1,
        rankedNumber: asCount(entry.number) ?? 0,
        finishedAt,
        mapId: map.id,
        mapName: map.name,
        mapImage: map.image,
        mode: sanitizeString(typeof entry.mode === "string" ? entry.mode : "Unknown", 32),
        winningTeam: teamId(entry.winningTeam),
        score: [asCount(score[0]) ?? 0, asCount(score[1]) ?? 0],
        players,
      },
    });
  }

  return {
    schema: RANKED_PUBLIC_SCHEMA,
    updatedAt: sanitizeString(snapshot.updatedAt, 40),
    series: groupSeries(pending),
  };
}

async function loadRankedMatches(): Promise<RankedMatchesPayload> {
  const snapshot = await getRankedSnapshot();
  return normalizeRankedMatches(snapshot);
}

/** Cached rich match list for /matches. Returns null when upstream is unavailable. */
export async function getRankedMatches(): Promise<RankedMatchesPayload | null> {
  try {
    return await cachedQuery(CACHE_KEY, loadRankedMatches, CACHE_TTL_MS);
  } catch (error) {
    safeLog.error("Failed to load ranked matches:", error);
    return null;
  }
}

/** Same payload as getRankedMatches, but throws for API error handling. */
export async function getRankedMatchesOrThrow(): Promise<RankedMatchesPayload> {
  return cachedQuery(CACHE_KEY, loadRankedMatches, CACHE_TTL_MS);
}
