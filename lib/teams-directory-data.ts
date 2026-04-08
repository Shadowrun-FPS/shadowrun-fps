import { unstable_cache } from "next/cache";
import { safeLog } from "@/lib/security";
import { enhanceTeamsWithTournamentRegistrations } from "@/lib/teams-directory-enhance";
import { fetchTournamentListingsFromDb } from "@/lib/tournament-listings-from-db";
import type { TeamListing, TournamentListing } from "@/types";

const getCachedTournamentsForDirectory = unstable_cache(
  async () => fetchTournamentListingsFromDb(),
  ["teams-directory-tournament-listings"],
  { revalidate: 30 },
);

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000"
  );
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
      getCachedTournamentsForDirectory(),
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
