export interface EloRating {
  rating: number;
  kFactor: number;
  tier: string;
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
