import { cachedQuery } from "@/lib/query-cache";
import { safeLog, sanitizeString } from "@/lib/security";
import { getRankTier } from "@/lib/leaderboard-stats";
import {
  RANKED_PUBLIC_SCHEMA,
  type LeaderboardMatch,
  type LeaderboardMatchPlayer,
  type LeaderboardPayload,
  type LeaderboardPlayer,
  type RankedPlayerTotals,
} from "@/types";

const DEFAULT_SNAPSHOT_URL =
  "https://test-downloads.shadowrunfps.com/ranked/v1/leaderboard.json";
const DEFAULT_ALLOWED_HOSTS = ["test-downloads.shadowrunfps.com"] as const;
const FETCH_TIMEOUT_MS = 5_000;
/** Headroom for scoreboard fields. The slim leaderboard projection still drops them. */
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const CACHE_TTL_MS = 60_000;
const RAW_CACHE_KEY = "ranked:snapshot:v1";
const CACHE_KEY = "leaderboard:public:v16";
const MAX_PLAYERS = 5_000;
const MAX_MATCHES = 500;
const MAX_MATCH_PLAYERS = 16;
const MAX_NAME_LENGTH = 64;
const PLAYER_ID_PATTERN = /^[a-f0-9]{24}$/i;

/**
 * Player ids omitted from public standings.
 * Their career profile still ships in `unlistedPlayers` for match sheets.
 */
const EXCLUDED_PLAYER_IDS = new Set(["dbbe8bde3b43ed17249712a3"]);

export function isUnlistedLeaderboardPlayer(playerId: string): boolean {
  return EXCLUDED_PLAYER_IDS.has(playerId.toLowerCase());
}

interface RankedSnapshotPlayer {
  elo: unknown;
  id: unknown;
  losses: unknown;
  matches: unknown;
  name: unknown;
  rank: unknown;
  statsMatches: unknown;
  totals: unknown;
  wins: unknown;
}

interface RankedSnapshotMatchPlayer {
  eloAfter: unknown;
  eloBefore: unknown;
  eloChange: unknown;
  id: unknown;
  performanceUsed: unknown;
  stats: unknown;
  team: unknown;
}

interface RankedSnapshotMatch {
  finishedAt: unknown;
  id: unknown;
  map: unknown;
  mode: unknown;
  number: unknown;
  players: unknown;
  score: unknown;
  winningTeam: unknown;
}

interface RankedSnapshot {
  matches: unknown;
  players: unknown;
  schema: unknown;
  updatedAt: unknown;
}

function extraAllowedHosts(): string[] {
  const raw = process.env.RANKED_LEADERBOARD_HOSTS;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return true;

  const [first, second] = octets;
  if (first === 10 || first === 127 || first === 0) return true;
  if (first === 169 && second === 254) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  return false;
}

function allowedHosts(): Set<string> {
  const hosts = new Set<string>([
    ...DEFAULT_ALLOWED_HOSTS,
    ...extraAllowedHosts(),
  ]);
  const envUrl = process.env.RANKED_LEADERBOARD_URL?.trim();
  if (envUrl) {
    try {
      const envHost = new URL(envUrl).hostname.toLowerCase();
      if (!isBlockedHostname(envHost)) {
        hosts.add(envHost);
      }
    } catch {
      // Invalid env URL is rejected later by assertSafeUpstreamUrl.
    }
  }
  return hosts;
}

function assertSafeUpstreamUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Ranked leaderboard URL is invalid.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Ranked leaderboard URL must use HTTPS.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (isBlockedHostname(hostname)) {
    throw new Error("Ranked leaderboard host is not allowed.");
  }

  if (!allowedHosts().has(hostname)) {
    throw new Error("Ranked leaderboard host is not allowed.");
  }

  return parsed;
}

function isJsonContentType(contentType: string | null, url: URL): boolean {
  if (!contentType) return url.pathname.toLowerCase().endsWith(".json");
  const type = contentType.split(";")[0].trim().toLowerCase();
  return (
    type === "application/json" ||
    type === "text/json" ||
    type === "application/octet-stream"
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asNonNegativeInt(value: unknown, fallback = 0): number {
  if (!isFiniteNumber(value)) return fallback;
  return Math.max(0, Math.trunc(value));
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return isFiniteNumber(value) ? value : fallback;
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

function recordExtreme(
  map: Map<string, number>,
  id: string,
  value: number,
  prefer: "min" | "max",
): void {
  const prior = map.get(id);
  if (
    prior == null ||
    (prefer === "max" ? value > prior : value < prior)
  ) {
    map.set(id, value);
  }
}

function parseTotals(value: unknown): RankedPlayerTotals {
  const totals =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    artifactPickups: asNonNegativeInt(totals.artifactPickups),
    artifactScores: asNonNegativeInt(totals.artifactScores),
    deaths: asNonNegativeInt(totals.deaths),
    friendlyFireTotal: asFiniteNumber(totals.friendlyFireTotal),
    kills: asNonNegativeInt(totals.kills),
    resurrects: asNonNegativeInt(totals.resurrects),
    scoreboardBonus: asFiniteNumber(totals.scoreboardBonus),
    shotsFired: asNonNegativeInt(totals.shotsFired),
    shotsHit: asNonNegativeInt(totals.shotsHit),
  };
}

function combatKd(totals: RankedPlayerTotals, statsMatches: number): number | null {
  if (statsMatches <= 0) return null;
  if (totals.deaths === 0) return totals.kills > 0 ? totals.kills : null;
  return totals.kills / totals.deaths;
}

export function normalizeLeaderboard(raw: unknown): LeaderboardPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Ranked snapshot is empty.");
  }

  const snapshot = raw as RankedSnapshot;
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

  const players: LeaderboardPlayer[] = [];
  const unlistedPlayers: LeaderboardPlayer[] = [];
  const namesById = new Map<string, string>();
  const bonusPerRoundAccrual = new Map<
    string,
    { bonus: number; rounds: number }
  >();
  const peakFriendlyFireById = new Map<string, number>();
  const peakEloById = new Map<string, number>();
  const peakKillsById = new Map<string, number>();
  const peakBonusById = new Map<string, number>();

  for (const entry of snapshot.players as RankedSnapshotPlayer[]) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id !== "string" || !PLAYER_ID_PATTERN.test(entry.id)) continue;

    const name = sanitizeString(
      typeof entry.name === "string" ? entry.name : "",
      MAX_NAME_LENGTH,
    );
    if (!name) continue;

    const matchesPlayed = asNonNegativeInt(entry.matches);
    const wins = asNonNegativeInt(entry.wins);
    const losses = asNonNegativeInt(entry.losses);
    const statsMatches = asNonNegativeInt(entry.statsMatches);
    const totals = parseTotals(entry.totals);
    const elo = asFiniteNumber(entry.elo);
    const rank = asNonNegativeInt(entry.rank, players.length + 1);

    const id = entry.id.toLowerCase();
    namesById.set(id, name);
    // Snapshot ranks include 0-match ladder entries. Public standings only
    // list players who have played, then re-rank so numbers stay consecutive.
    if (matchesPlayed < 1) continue;

    const player: LeaderboardPlayer = {
      id,
      name,
      rank,
      elo,
      wins,
      losses,
      matches: matchesPlayed,
      statsMatches,
      winRate: ratio(wins, matchesPlayed),
      kd: combatKd(totals, statsMatches),
      accuracy: ratio(totals.shotsHit, totals.shotsFired),
      avgKills: ratio(totals.kills, statsMatches),
      avgDeaths: ratio(totals.deaths, statsMatches),
      avgResurrects: ratio(totals.resurrects, statsMatches),
      avgBonus: ratio(totals.scoreboardBonus, statsMatches),
      avgBonusPerRound: null,
      peakFriendlyFire: null,
      peakElo: elo,
      peakKills: null,
      peakBonus: null,
      totals,
      tier: getRankTier(elo),
    };

    peakEloById.set(id, elo);
    if (EXCLUDED_PLAYER_IDS.has(id)) {
      unlistedPlayers.push(player);
      continue;
    }
    players.push(player);
  }

  const matches: LeaderboardMatch[] = [];

  for (const entry of snapshot.matches as RankedSnapshotMatch[]) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id !== "string" || !PLAYER_ID_PATTERN.test(entry.id)) continue;
    if (typeof entry.finishedAt !== "string") continue;
    if (!Array.isArray(entry.players) || entry.players.length > MAX_MATCH_PLAYERS) {
      continue;
    }

    const score = Array.isArray(entry.score) ? entry.score : [];
    const teamZeroScore = asNonNegativeInt(score[0]);
    const teamOneScore = asNonNegativeInt(score[1]);
    const winningTeam = entry.winningTeam === 1 ? 1 : 0;
    const matchRounds = teamZeroScore + teamOneScore;

    const matchPlayers: LeaderboardMatchPlayer[] = [];
    for (const rawPlayer of entry.players as RankedSnapshotMatchPlayer[]) {
      if (!rawPlayer || typeof rawPlayer !== "object") continue;
      if (typeof rawPlayer.id !== "string" || !PLAYER_ID_PATTERN.test(rawPlayer.id)) {
        continue;
      }

      const id = rawPlayer.id.toLowerCase();
      const team = rawPlayer.team === 1 ? 1 : 0;
      const eloBefore = asFiniteNumber(rawPlayer.eloBefore);
      const eloAfter = asFiniteNumber(rawPlayer.eloAfter);
      const hasStats =
        rawPlayer.performanceUsed === true &&
        rawPlayer.stats != null &&
        typeof rawPlayer.stats === "object";
      const stats = hasStats ? parseTotals(rawPlayer.stats) : null;
      matchPlayers.push({
        id,
        name: namesById.get(id) ?? "Unknown",
        team,
        eloBefore,
        eloAfter,
        eloChange: asFiniteNumber(rawPlayer.eloChange),
        performanceUsed: hasStats,
        stats,
      });

      recordExtreme(peakEloById, id, eloBefore, "max");
      recordExtreme(peakEloById, id, eloAfter, "max");

      if (stats) {
        recordExtreme(
          peakFriendlyFireById,
          id,
          stats.friendlyFireTotal,
          "min",
        );
        recordExtreme(peakKillsById, id, stats.kills, "max");
        recordExtreme(peakBonusById, id, stats.scoreboardBonus, "max");

        if (matchRounds > 0) {
          const accrued = bonusPerRoundAccrual.get(id) ?? {
            bonus: 0,
            rounds: 0,
          };
          accrued.bonus += stats.scoreboardBonus;
          accrued.rounds += matchRounds;
          bonusPerRoundAccrual.set(id, accrued);
        }
      }
    }

    matches.push({
      id: entry.id.toLowerCase(),
      finishedAt: sanitizeString(entry.finishedAt, 40),
      map: sanitizeString(typeof entry.map === "string" ? entry.map : "Unknown", 64),
      mode: sanitizeString(typeof entry.mode === "string" ? entry.mode : "Unknown", 32),
      number: asNonNegativeInt(entry.number),
      score: [teamZeroScore, teamOneScore],
      winningTeam,
      players: matchPlayers,
    });
  }

  const applyDerivedPeaks = (player: LeaderboardPlayer) => {
    const accrued = bonusPerRoundAccrual.get(player.id);
    player.avgBonusPerRound = accrued
      ? ratio(accrued.bonus, accrued.rounds)
      : null;
    player.peakFriendlyFire = peakFriendlyFireById.get(player.id) ?? null;
    player.peakElo = peakEloById.get(player.id) ?? player.elo;
    player.peakKills = peakKillsById.get(player.id) ?? null;
    player.peakBonus = peakBonusById.get(player.id) ?? null;
  };

  players.sort((first, second) => first.rank - second.rank);
  players.forEach((player, index) => {
    player.rank = index + 1;
    applyDerivedPeaks(player);
  });
  unlistedPlayers.forEach(applyDerivedPeaks);

  return {
    schema: RANKED_PUBLIC_SCHEMA,
    updatedAt: sanitizeString(snapshot.updatedAt, 40),
    players,
    unlistedPlayers,
    matches,
  };
}

async function fetchRankedSnapshot(): Promise<unknown> {
  const rawUrl = process.env.RANKED_LEADERBOARD_URL?.trim() || DEFAULT_SNAPSHOT_URL;
  const url = assertSafeUpstreamUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const headers: HeadersInit = { Accept: "application/json" };
    const token = process.env.RANKED_LEADERBOARD_TOKEN?.trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "error",
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Upstream responded ${response.status}`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      throw new Error("Upstream payload is too large.");
    }

    if (!isJsonContentType(response.headers.get("content-type"), url)) {
      throw new Error("Upstream did not return JSON.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_BODY_BYTES) {
      throw new Error("Upstream payload is too large.");
    }

    return JSON.parse(buffer.toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Ranked snapshot timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** One upstream download shared by the slim leaderboard and rich match projections. */
export async function getRankedSnapshot(): Promise<unknown> {
  return cachedQuery(RAW_CACHE_KEY, fetchRankedSnapshot, CACHE_TTL_MS);
}

async function loadLeaderboard(): Promise<LeaderboardPayload> {
  const snapshot = await getRankedSnapshot();
  return normalizeLeaderboard(snapshot);
}

/** Cached public payload for SSR. Returns null when upstream is unavailable. */
export async function getLeaderboard(): Promise<LeaderboardPayload | null> {
  try {
    return await cachedQuery(CACHE_KEY, loadLeaderboard, CACHE_TTL_MS);
  } catch (error) {
    safeLog.error("Failed to load leaderboard:", error);
    return null;
  }
}

/** Same payload as getLeaderboard, but throws for API error handling. */
export async function getLeaderboardOrThrow(): Promise<LeaderboardPayload> {
  return cachedQuery(CACHE_KEY, loadLeaderboard, CACHE_TTL_MS);
}
