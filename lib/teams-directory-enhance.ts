import type { TeamListing, TournamentListing } from "@/types";

/** Pure helper — safe to import from Client Components (no Mongo / Node APIs). */
export function enhanceTeamsWithTournamentRegistrations(
  teams: TeamListing[],
  tournaments: TournamentListing[],
): TeamListing[] {
  if (!tournaments.length) return teams;
  const map = new Map<string, string[]>();
  for (const t of tournaments) {
    if (!t.registeredTeams?.length) continue;
    for (const reg of t.registeredTeams) {
      const teamId =
        typeof reg === "object" && reg && "_id" in reg
          ? String((reg as { _id: string })._id)
          : String(reg);
      if (!map.has(teamId)) map.set(teamId, []);
      map.get(teamId)!.push(t._id);
    }
  }
  return teams.map((team) => ({
    ...team,
    tournaments: map.get(team._id.toString()) ?? team.tournaments ?? [],
  }));
}
