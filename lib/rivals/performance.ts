import type { RankedPlayerTotals } from "@/types/leaderboard";
import type {
  PerformanceRates,
  RivalEncounter,
  RivalPerformance,
  RivalSourceMatch,
} from "@/types/rivals";

function emptyRates(): PerformanceRates & {
  kills: number;
  deaths: number;
  resurrects: number;
  roundKills: number;
  roundResurrects: number;
  shotsFired: number;
  shotsHit: number;
} {
  return {
    sample: 0,
    meetings: 0,
    rounds: 0,
    killsPerRound: null,
    resurrectsPerRound: null,
    kd: null,
    accuracy: null,
    kills: 0,
    deaths: 0,
    resurrects: 0,
    roundKills: 0,
    roundResurrects: 0,
    shotsFired: 0,
    shotsHit: 0,
  };
}

function addStats(
  rates: ReturnType<typeof emptyRates>,
  stats: RankedPlayerTotals | null,
  rounds: number,
): void {
  rates.meetings += 1;
  if (!stats) return;
  rates.sample += 1;
  rates.kills += stats.kills;
  rates.deaths += stats.deaths;
  rates.resurrects += stats.resurrects;
  rates.shotsFired += stats.shotsFired;
  rates.shotsHit += stats.shotsHit;
  if (rounds > 0) {
    rates.rounds += rounds;
    rates.roundKills += stats.kills;
    rates.roundResurrects += stats.resurrects;
  }
}

function finish(rates: ReturnType<typeof emptyRates>): PerformanceRates {
  return {
    sample: rates.sample,
    meetings: rates.meetings,
    rounds: rates.rounds,
    killsPerRound: rates.rounds > 0 ? rates.roundKills / rates.rounds : null,
    resurrectsPerRound:
      rates.rounds > 0 ? rates.roundResurrects / rates.rounds : null,
    kd:
      rates.sample <= 0
        ? null
        : rates.deaths === 0
          ? rates.kills > 0
            ? rates.kills
            : null
          : rates.kills / rates.deaths,
    accuracy: rates.shotsFired > 0 ? rates.shotsHit / rates.shotsFired : null,
  };
}

function roundsPlayed(score: [number, number]): number {
  return score[0] + score[1];
}

export function rivalPerformance(
  matches: RivalSourceMatch[],
  encounters: RivalEncounter[],
  playerId: string,
): RivalPerformance {
  const versus = emptyRates();
  const other = emptyRates();
  const versusIds = new Set(encounters.map((encounter) => encounter.matchId));

  for (const encounter of encounters) {
    const seat = encounter.seats.find((entry) => entry.id === playerId);
    addStats(versus, seat?.stats ?? null, roundsPlayed(encounter.score));
  }

  for (const match of matches) {
    const matchId = match.id.toLowerCase();
    if (versusIds.has(matchId)) continue;
    const seat = match.players.find((player) => player.id.toLowerCase() === playerId);
    if (!seat) continue;
    addStats(other, seat.stats, roundsPlayed(match.score));
  }

  return { versus: finish(versus), other: finish(other) };
}
