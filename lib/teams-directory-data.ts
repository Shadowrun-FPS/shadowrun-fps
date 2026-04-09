import { unstable_cache } from "next/cache";
import { safeLog } from "@/lib/security";
import { enhanceTeamsWithTournamentRegistrations } from "@/lib/teams-directory-enhance";
import { fetchTournamentListingsFromDb } from "@/lib/tournament-listings-from-db";
import { connectToDatabase } from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import type { TeamListing, TournamentListing } from "@/types";

const getCachedTournamentsForDirectory = unstable_cache(
  async () => fetchTournamentListingsFromDb(),
  ["teams-directory-tournament-listings"],
  { revalidate: 30 },
);

/**
 * Serialize a member/captain subdocument to a plain object.
 * Explicitly picks only the known scalar fields so no ObjectId, Date, or
 * extra player fields (e.g. preferredRaces) ever cross the Server→Client boundary.
 */
function serializeTeamMember(m: any) {
  return {
    discordId: m.discordId ?? "",
    discordUsername: m.discordUsername ?? null,
    discordNickname: m.discordNickname ?? null,
    discordProfilePicture: m.discordProfilePicture ?? null,
    playerId: typeof m.playerId === "string" ? m.playerId : null,
    role: m.role ?? null,
    joinedAt:
      m.joinedAt instanceof Date
        ? m.joinedAt.toISOString()
        : (m.joinedAt ?? null),
    elo: typeof m.elo === "number" ? m.elo : undefined,
  };
}

/** Direct DB query — avoids HTTP self-fetch which is unreliable in production. */
async function fetchAllTeamsFromDb(): Promise<TeamListing[]> {
  const { db } = await connectToDatabase();
  const allCollections = getAllTeamCollectionNames();
  const allTeams: any[] = [];

  for (const collectionName of allCollections) {
    const teams = await db
      .collection(collectionName)
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    for (const t of teams) {
      allTeams.push({
        _id: t._id.toString(),
        name: t.name ?? "",
        tag: t.tag ?? "",
        description: t.description ?? "",
        teamElo: typeof t.teamElo === "number" ? t.teamElo : 0,
        teamSize: typeof t.teamSize === "number" ? t.teamSize : 4,
        wins: typeof t.wins === "number" ? t.wins : 0,
        losses: typeof t.losses === "number" ? t.losses : 0,
        createdAt:
          t.createdAt instanceof Date
            ? t.createdAt.toISOString()
            : (t.createdAt ?? null),
        captain: t.captain ? serializeTeamMember(t.captain) : null,
        members: Array.isArray(t.members)
          ? t.members.map(serializeTeamMember)
          : [],
      });
    }
  }

  allTeams.sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

  return allTeams.slice(0, 100) as TeamListing[];
}

export async function fetchTeamsDirectoryData(): Promise<{
  teams: TeamListing[];
  tournaments: TournamentListing[];
}> {
  try {
    const [teamsArray, tournaments] = await Promise.all([
      fetchAllTeamsFromDb(),
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
