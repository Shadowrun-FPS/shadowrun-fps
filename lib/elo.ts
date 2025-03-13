export interface EloRating {
  rating: number;
  kFactor: number;
  tier: string;
}

export interface Player {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo?: number;
}

interface TeamEloResult {
  winningTeam?: any[];
  losingTeam?: any[];
  winningTeamNewElos?: number[];
  losingTeamNewElos?: number[];
  winningTeamEloChanges?: number[];
  losingTeamEloChanges?: number[];
}

export const EloTiers = {
  BRONZE: { min: 0, max: 1199 },
  SILVER: { min: 1200, max: 1499 },
  GOLD: { min: 1500, max: 1799 },
  PLATINUM: { min: 1800, max: 2099 },
  DIAMOND: { min: 2100, max: 2399 },
  MASTER: { min: 2400, max: Infinity },
} as const;

export function calculateElo(
  playerRating: number,
  opponentRating: number,
  outcome: "win" | "loss" | "draw",
  kFactor: number = 32
): number {
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = outcome === "win" ? 1 : outcome === "loss" ? 0 : 0.5;
  return Math.round(playerRating + kFactor * (actualScore - expectedScore));
}

export function calculateTeamElo(
  winningTeamPlayers: Player[],
  losingTeamPlayers: Player[],
  teamSize: number,
  scoreMultiplier = 1
): TeamEloResult {
  // Get average ELOs
  const winningTeamElo = calculateAverageElo(winningTeamPlayers);
  const losingTeamElo = calculateAverageElo(losingTeamPlayers);

  // Calculate win probability
  const winProbability = calculateWinProbability(winningTeamElo, losingTeamElo);

  // Apply score multiplier to K-factor
  const K = 32 * scoreMultiplier; // Base K-factor * score multiplier

  // Calculate ELO changes
  const eloChange = Math.round(K * (1 - winProbability));

  // Apply changes to each player
  const winningTeam = winningTeamPlayers.map((player) => ({
    ...player,
    elo: Math.round((player.elo || 1500) + eloChange),
  }));

  const losingTeam = losingTeamPlayers.map((player) => ({
    ...player,
    elo: Math.round((player.elo || 1500) - eloChange),
  }));

  return { winningTeam, losingTeam };
}

export function getTier(rating: number): string {
  for (const [tier, range] of Object.entries(EloTiers)) {
    if (rating >= range.min && rating <= range.max) {
      return tier;
    }
  }
  return "UNRANKED";
}

export function canPlayTogether(
  player1Rating: number,
  player2Rating: number,
  maxDiff: number = 400
): boolean {
  return Math.abs(player1Rating - player2Rating) <= maxDiff;
}

// Function to calculate team's total ELO
export function calculateTotalTeamElo(players: Player[]): number {
  return players.reduce((total, player) => total + (player.elo || 0), 0);
}

// Function to calculate team's average ELO
export function calculateAverageElo(players: Player[]): number {
  if (players.length === 0) return 0;
  return calculateTotalTeamElo(players) / players.length;
}

// Calculate win probability based on ELO difference
function calculateWinProbability(teamAElo: number, teamBElo: number): number {
  return 1 / (1 + Math.pow(10, (teamBElo - teamAElo) / 400));
}

// Calculate K-factor based on player's ELO
function getKFactor(elo: number): number {
  if (elo < 1500) return 32;
  if (elo < 2000) return 24;
  return 16;
}

// Calculate performance factor based on round difference
function calculatePerformanceFactor(roundDifference: number): number {
  // Scale from 0.5 to 1.5 based on round difference
  return Math.min(1.5, 0.5 + roundDifference / 12);
}

// Main ELO calculation function
export function calculateNewElos(
  winningTeamPlayers: Player[],
  losingTeamPlayers: Player[],
  roundDifference: number
): TeamEloResult {
  // Get average ELOs
  const winningTeamElo = calculateAverageElo(winningTeamPlayers);
  const losingTeamElo = calculateAverageElo(losingTeamPlayers);

  // Calculate win probability
  const winningTeamExpectedWin = calculateWinProbability(
    winningTeamElo,
    losingTeamElo
  );
  const losingTeamExpectedWin = 1 - winningTeamExpectedWin;

  // Performance factor based on round difference
  const performanceFactor = calculatePerformanceFactor(roundDifference);

  // Calculate new ELOs for winning team
  const winningTeamNewElos = winningTeamPlayers.map((player) => {
    const playerElo = player.elo || 1500; // Default to 1500 if undefined
    const kFactor = getKFactor(playerElo);
    const eloChange = Math.round(
      kFactor * (1 - winningTeamExpectedWin) * performanceFactor
    );
    return playerElo + eloChange;
  });

  // Calculate new ELOs for losing team
  const losingTeamNewElos = losingTeamPlayers.map((player) => {
    const playerElo = player.elo || 1500; // Default to 1500 if undefined
    const kFactor = getKFactor(playerElo);
    const eloChange = Math.round(
      kFactor * (0 - losingTeamExpectedWin) * performanceFactor
    );
    return playerElo + eloChange;
  });

  // Calculate ELO changes
  const winningTeamEloChanges = winningTeamNewElos.map(
    (newElo, i) => newElo - (winningTeamPlayers[i].elo || 1500)
  );
  const losingTeamEloChanges = losingTeamNewElos.map(
    (newElo, i) => newElo - (losingTeamPlayers[i].elo || 1500)
  );

  return {
    winningTeamNewElos,
    losingTeamNewElos,
    winningTeamEloChanges,
    losingTeamEloChanges,
  };
}
