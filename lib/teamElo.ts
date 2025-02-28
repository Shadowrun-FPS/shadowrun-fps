import { calculateElo } from "./elo";

interface TeamMember {
  discordId: string;
  elo: number;
}

export function calculateTeamElo(team: TeamMember[]): number {
  return Math.round(
    team.reduce((sum, player) => sum + player.elo, 0) / team.length
  );
}

export function calculateTeamEloChanges(
  team1: TeamMember[],
  team2: TeamMember[],
  winner: 1 | 2,
  kFactor: number = 32
): { team1Changes: number[]; team2Changes: number[] } {
  const team1Avg = calculateTeamElo(team1);
  const team2Avg = calculateTeamElo(team2);

  const outcome = winner === 1 ? "win" : "loss";
  const reverseOutcome = winner === 1 ? "loss" : "win";

  // Calculate individual ELO changes
  const team1Changes = team1.map((player) => {
    const change =
      calculateElo(player.elo, team2Avg, outcome, kFactor) - player.elo;
    return change;
  });

  const team2Changes = team2.map((player) => {
    const change =
      calculateElo(player.elo, team1Avg, reverseOutcome, kFactor) - player.elo;
    return change;
  });

  return { team1Changes, team2Changes };
}
