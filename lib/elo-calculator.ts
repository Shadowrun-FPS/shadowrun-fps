/**
 * Calculates the combined ELO for a team based on member ELOs
 * @param memberElos Array of individual ELO ratings for each team member
 * @param teamSize The expected team size (typically 4 for your application)
 * @returns The calculated team ELO
 */
export function calculateTeamElo(
  memberElos: number[],
  teamSize: number = 4
): number {
  // If there are no members, return 0
  if (!memberElos.length) return 0;

  // Sort ELOs in descending order
  const sortedElos = [...memberElos].sort((a, b) => b - a);

  // If we don't have enough members to fill a team, use placeholder values
  // for missing members (typically 1000 is used as a baseline ELO)
  while (sortedElos.length < teamSize) {
    sortedElos.push(1000);
  }

  // Take only the top players needed for the team size
  const teamElos = sortedElos.slice(0, teamSize);

  // Apply a weighted calculation that gives more emphasis to higher-ranked players
  // This is a common approach in team-based games
  let totalWeight = 0;
  let weightedSum = 0;

  for (let i = 0; i < teamSize; i++) {
    // Apply diminishing weights (e.g., 1.0, 0.8, 0.6, 0.4 for a 4-person team)
    const weight = 1 - i * 0.2;
    totalWeight += weight;
    weightedSum += teamElos[i] * weight;
  }

  // Calculate the weighted average and round to the nearest integer
  return Math.round(weightedSum / totalWeight);
}

/**
 * Display a formatted team ELO score with thousands separator
 * @param elo The numeric ELO score
 * @returns Formatted string (e.g., "6,679")
 */
export function formatEloScore(elo: number): string {
  return elo.toLocaleString();
}
