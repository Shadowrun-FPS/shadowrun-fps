import { resolveAsOfMs } from "@/lib/rivals/pairs";
import { DAY_MS, RECENT_WINDOW_MS } from "@/lib/rivals/config";
import type { LeaderboardMatch, LeaderboardPayload, RankedPlayerTotals } from "@/types/leaderboard";
import type {
  CompareMapRow,
  CompareOutcome,
  CompareQuery,
  ComparisonModel,
  PlayerSample,
} from "@/types/compare";

interface PreparedSeat {
  team: 0 | 1;
  stats: RankedPlayerTotals | null;
  damagePercent: number | null;
}

interface PreparedMatch {
  id: string;
  finishedAt: string;
  finishedMs: number;
  map: string;
  mode: string;
  rounds: number;
  winningTeam: 0 | 1;
  decisive: boolean;
  score: [number, number];
  seats: Map<string, PreparedSeat>;
}

function emptySample(playerId: string): PlayerSample {
  return {
    playerId,
    matches: 0,
    wins: 0,
    losses: 0,
    decisive: 0,
    statRows: 0,
    damagePercentSum: 0,
    damageRows: 0,
    kills: 0,
    deaths: 0,
    killsWithRounds: 0,
    killRoundRows: 0,
    roundsWithKills: 0,
    resurrects: 0,
    resurrectsWithRounds: 0,
    resRoundRows: 0,
    roundsWithResurrects: 0,
    bonus: 0,
    bonusWithRounds: 0,
    bonusRoundRows: 0,
    roundsWithBonus: 0,
    shotsFired: 0,
    shotsHit: 0,
    shotRows: 0,
    artifactPickups: 0,
    artifactScores: 0,
    friendlyFire: 0,
    maps: [],
    evidence: [],
  };
}

function prepareMatch(match: LeaderboardMatch): PreparedMatch {
  const finishedMs = Date.parse(match.finishedAt);
  const rounds =
    Number.isFinite(match.score[0]) && Number.isFinite(match.score[1]) && match.score[0] + match.score[1] > 0
      ? match.score[0] + match.score[1]
      : 0;
  const seats = new Map<string, PreparedSeat>();
  for (const player of match.players) {
    const id = player.id.toLowerCase();
    if (seats.has(id)) continue;
    seats.set(id, {
      team: player.team,
      stats: player.stats,
      damagePercent: player.damagePercent,
    });
  }
  return {
    id: match.id.toLowerCase(),
    finishedAt: match.finishedAt,
    finishedMs: Number.isFinite(finishedMs) ? finishedMs : Number.NaN,
    map: match.map,
    mode: match.mode,
    rounds,
    winningTeam: match.winningTeam,
    decisive: match.decisive,
    score: match.score,
    seats,
  };
}

function dedupeMatches(matches: LeaderboardMatch[]): PreparedMatch[] {
  const byId = new Map<string, { match: LeaderboardMatch; index: number }>();
  matches.forEach((match, index) => {
    const id = match.id.toLowerCase();
    const previous = byId.get(id);
    if (!previous) {
      byId.set(id, { match, index });
      return;
    }
    const previousMs = Date.parse(previous.match.finishedAt);
    const nextMs = Date.parse(match.finishedAt);
    const previousTime = Number.isFinite(previousMs) ? previousMs : Number.NEGATIVE_INFINITY;
    const nextTime = Number.isFinite(nextMs) ? nextMs : Number.NEGATIVE_INFINITY;
    if (nextTime > previousTime || (nextTime === previousTime && index > previous.index)) {
      byId.set(id, { match, index });
    }
  });
  return [...byId.values()].map((entry) => prepareMatch(entry.match));
}

function inWindow(match: PreparedMatch, asOfMs: number, window: CompareQuery["window"]): boolean {
  if (window === "all") return true;
  if (!Number.isFinite(match.finishedMs)) return false;
  const span = window === "7d" ? 7 * DAY_MS : RECENT_WINDOW_MS;
  return asOfMs - match.finishedMs <= span;
}

function outcomeFor(match: PreparedMatch, team: 0 | 1): CompareOutcome {
  if (!match.decisive) return "unresolved";
  return team === match.winningTeam ? "win" : "loss";
}

function scoreLabel(match: PreparedMatch, team: 0 | 1): string {
  const mine = match.score[team];
  const theirs = match.score[team === 0 ? 1 : 0];
  return `${mine}–${theirs}`;
}

function addMatch(sample: PlayerSample, match: PreparedMatch, seat: PreparedSeat): void {
  sample.matches += 1;
  const outcome = outcomeFor(match, seat.team);
  if (outcome === "win") {
    sample.wins += 1;
    sample.decisive += 1;
  } else if (outcome === "loss") {
    sample.losses += 1;
    sample.decisive += 1;
  }

  const stats = seat.stats;
    if (seat.damagePercent != null) {
      sample.damagePercentSum += seat.damagePercent;
      sample.damageRows += 1;
    }
    if (stats) {
    sample.statRows += 1;
    sample.kills += stats.kills;
    sample.deaths += stats.deaths;
    sample.resurrects += stats.resurrects;
    sample.bonus += stats.scoreboardBonus;
    sample.artifactPickups += stats.artifactPickups;
    sample.artifactScores += stats.artifactScores;
    sample.friendlyFire += stats.friendlyFireTotal;
    if (match.rounds > 0) {
      sample.killsWithRounds += stats.kills;
      sample.killRoundRows += 1;
      sample.roundsWithKills += match.rounds;
      sample.resurrectsWithRounds += stats.resurrects;
      sample.resRoundRows += 1;
      sample.roundsWithResurrects += match.rounds;
      sample.bonusWithRounds += stats.scoreboardBonus;
      sample.bonusRoundRows += 1;
      sample.roundsWithBonus += match.rounds;
    }
    if (stats.shotsFired > 0) {
      sample.shotsFired += stats.shotsFired;
      sample.shotsHit += stats.shotsHit;
      sample.shotRows += 1;
    }
  }

  sample.evidence.push({
    matchId: match.id,
    finishedAt: match.finishedAt,
    map: match.map,
    mode: match.mode,
    outcome,
    scoreLabel: scoreLabel(match, seat.team),
    statsRecorded: stats != null,
    killsPerRound: stats && match.rounds > 0 ? stats.kills / match.rounds : null,
  });
}

function finishMaps(sample: PlayerSample, rows: Map<string, CompareMapRow & {
  killsWithRounds: number;
  rounds: number;
}>): void {
  sample.maps = [...rows.values()]
    .map((row) => ({
      map: row.map,
      wins: row.wins,
      losses: row.losses,
      meetings: row.meetings,
      killsPerRound: row.rounds > 0 ? row.killsWithRounds / row.rounds : null,
    }))
    .sort((left, right) => right.meetings - left.meetings || left.map.localeCompare(right.map));
  sample.evidence.sort((left, right) => Date.parse(right.finishedAt) - Date.parse(left.finishedAt));
}

function samplePlayer(playerId: string, matches: PreparedMatch[]): PlayerSample {
  const sample = emptySample(playerId);
  const maps = new Map<string, CompareMapRow & { killsWithRounds: number; rounds: number }>();
  for (const match of matches) {
    const seat = match.seats.get(playerId);
    if (!seat) continue;
    addMatch(sample, match, seat);
    const row = maps.get(match.map) ?? {
      map: match.map,
      wins: 0,
      losses: 0,
      meetings: 0,
      killsPerRound: null,
      killsWithRounds: 0,
      rounds: 0,
    };
    row.meetings += 1;
    const outcome = outcomeFor(match, seat.team);
    if (outcome === "win") row.wins += 1;
    if (outcome === "loss") row.losses += 1;
    if (seat.stats && match.rounds > 0) {
      row.killsWithRounds += seat.stats.kills;
      row.rounds += match.rounds;
    }
    maps.set(match.map, row);
  }
  finishMaps(sample, maps);
  return sample;
}

export function listModes(matches: LeaderboardMatch[]): string[] {
  return [...new Set(matches.map((match) => match.mode))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function listMaps(matches: LeaderboardMatch[]): string[] {
  return [...new Set(matches.map((match) => match.map))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function buildComparison(payload: LeaderboardPayload, query: CompareQuery): ComparisonModel {
  const prepared = dedupeMatches(payload.matches);
  const asOfMs = resolveAsOfMs(payload.updatedAt, payload.matches);
  const maps = [...new Set(prepared.map((match) => match.map))].sort((a, b) => a.localeCompare(b));
  const modes = [...new Set(prepared.map((match) => match.mode))].sort((a, b) => a.localeCompare(b));

  const filtered = prepared.filter((match) => {
    if (!inWindow(match, asOfMs, query.window)) return false;
    if (query.map && match.map !== query.map) return false;
    if (query.mode && match.mode !== query.mode) return false;
    return true;
  });

  const shared =
    query.playerIds.length === 0
      ? []
      : filtered.filter((match) => query.playerIds.every((id) => match.seats.has(id)));
  const pool = query.scope === "shared" ? shared : filtered;

  return {
    asOfMs,
    maps,
    modes,
    sharedMatchCount: shared.length,
    emptyShared: query.scope === "shared" && query.playerIds.length >= 2 && shared.length === 0,
    players: query.playerIds.map((playerId) => samplePlayer(playerId, pool)),
  };
}
