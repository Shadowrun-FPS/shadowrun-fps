import { safeLog } from "@/lib/security";
import type { TeamListing, TournamentListing } from "@/types";

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000"
  );
}

export function enhanceTeamsWithTournamentRegistrations(
  teams: TeamListing[],
  tournaments: TournamentListing[]
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

async function fetchJsonArray<T>(
  path: string,
  revalidateSeconds: number
): Promise<T[]> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}${path}`, {
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? (json as T[]) : [];
  } catch {
    // Build-time / offline: no server at NEXTAUTH_URL — avoid throwing or error logging.
    return [];
  }
}

export async function fetchTeamsDirectoryData(): Promise<{
  teams: TeamListing[];
  tournaments: TournamentListing[];
}> {
  try {
    const [teamsArray, tournaments] = await Promise.all([
      fetchJsonArray<TeamListing>("/api/teams", 60),
      fetchJsonArray<TournamentListing>("/api/tournaments", 30),
    ]);

    const enhanced = enhanceTeamsWithTournamentRegistrations(
      teamsArray,
      tournaments
    );
    return { teams: enhanced, tournaments };
  } catch (error) {
    safeLog.error("fetchTeamsDirectoryData:", error);
    return { teams: [], tournaments: [] };
  }
}
