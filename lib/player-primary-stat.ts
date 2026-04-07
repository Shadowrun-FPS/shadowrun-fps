/**
 * Preferred queue for profile header / OG copy: 4v4 first, then 2v2 / 5v5 / 1v1, else first entry.
 * Keep in sync with `buildDescription` in app/player/stats/page.tsx.
 */
export type TeamStatLike = {
  teamSize: number;
  elo?: number;
  wins?: number;
  losses?: number;
  lastMatchDate?: string;
};

export function getPrimaryTeamStat<T extends TeamStatLike>(stats: T[]): T | null {
  if (!stats.length) return null;
  const prefer4v4 = stats.find((s) => s.teamSize === 4);
  const fallback = stats.find(
    (s) => s.teamSize === 2 || s.teamSize === 5 || s.teamSize === 1
  );
  return prefer4v4 ?? fallback ?? stats[0] ?? null;
}

export function formatTeamSizeLabel(teamSize: number): string {
  return `${teamSize}v${teamSize}`;
}
