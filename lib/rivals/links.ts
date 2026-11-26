export function rivalryHref(pairKey: string, playerId?: string | null): string {
  const params = new URLSearchParams();
  if (playerId) params.set("player", playerId);
  const query = params.toString();
  return `/leaderboard/rivals/${pairKey}${query ? `?${query}` : ""}`;
}

export function rivalsOverviewHref(playerId?: string | null): string {
  if (!playerId) return "/leaderboard/rivals";
  return `/leaderboard/rivals?player=${playerId}`;
}
