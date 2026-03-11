import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getAllTeamCollectionNames } from "@/lib/team-collections";

const DEFAULT_INDIVIDUAL_ELO = 800;

/**
 * Resolves each member's ELO for a given team size (from Players.stats or DB2 for 4v4).
 * Use for enriching team API responses so roster can show individual ELO.
 */
export async function getMemberElosForTeamSize(
  memberIds: string[],
  teamSize: number = 4
): Promise<Record<string, number>> {
  if (memberIds.length === 0) return {};
  const client = await clientPromise;
  const webDb = client.db("ShadowrunWeb");
  const db2 = client.db("ShadowrunDB2");

  type WebPlayer = { discordId: string; stats?: { teamSize: number; elo: number }[] };
  const webPlayers = (await webDb
    .collection("Players")
    .find({ discordId: { $in: memberIds } })
    .toArray()) as unknown as WebPlayer[];

  let db2Players: { discordId: string; rating?: number }[] = [];
  if (teamSize === 4) {
    db2Players = (await db2
      .collection("players")
      .find({ discordId: { $in: memberIds } })
      .toArray()) as unknown as { discordId: string; rating?: number }[];
  }

  const elos: Record<string, number> = {};
  for (const playerId of memberIds) {
    let playerElo = DEFAULT_INDIVIDUAL_ELO;
    const webPlayer = webPlayers.find((p) => p.discordId === playerId);
    if (webPlayer && webPlayer.stats && Array.isArray(webPlayer.stats)) {
      const statForSize = webPlayer.stats.find((s) => s.teamSize === teamSize);
      if (statForSize && typeof statForSize.elo === "number") {
        playerElo = statForSize.elo;
      }
    }
    if (teamSize === 4) {
      const db2Player = db2Players.find((p) => p.discordId === playerId);
      if (db2Player && db2Player.rating !== undefined) {
        playerElo = db2Player.rating;
      }
    }
    elos[playerId] = playerElo;
  }
  return elos;
}

/**
 * Calculates and updates a team's ELO based on its members
 * @param teamId The MongoDB ObjectId of the team
 * @returns The updated team ELO value
 */
export async function recalculateTeamElo(teamId: string): Promise<number> {
  try {
    const client = await clientPromise;
    const webDb = client.db("ShadowrunWeb");

    // Get the team with members - search across all team collections
    const allCollections = getAllTeamCollectionNames();
    let team = null;
    let teamCollection = null;

    for (const collectionName of allCollections) {
      team = await webDb.collection(collectionName).findOne({
        _id: new ObjectId(teamId),
      });
      if (team) {
        teamCollection = collectionName;
        break;
      }
    }

    if (!team || !teamCollection) {
      console.error(`Team not found: ${teamId}`);
      return DEFAULT_INDIVIDUAL_ELO; // Fallback ELO for single player
    }

    // Check the team's configured size (default to 4 if not specified)
    const configuredTeamSize = team.teamSize || 4;

    // Get all member IDs including captain
    const memberIds = team.members.map((member: any) => member.discordId);
    if (team.captain && team.captain.discordId) {
      if (!memberIds.includes(team.captain.discordId)) {
        memberIds.push(team.captain.discordId);
      }
    }


    const teamElos: Record<string, number> = {};
    const memberElosMap = await getMemberElosForTeamSize(memberIds, configuredTeamSize);
    const memberElos = memberIds.map((id: string) => memberElosMap[id] ?? DEFAULT_INDIVIDUAL_ELO);

    // Take top players based on team size
    const sortedElos = [...memberElos].sort((a, b) => b - a);
    const topElos = sortedElos.slice(0, configuredTeamSize);

    // Calculate total team ELO
    const totalElo = topElos.reduce((sum, elo) => sum + elo, 0);

    teamElos[`size${configuredTeamSize}`] = totalElo;

    // Calculate fallback ELO based on configured team size
    const fallbackElo = DEFAULT_INDIVIDUAL_ELO * configuredTeamSize;

    // Update the team with calculated ELO in the correct collection
    await webDb.collection(teamCollection).updateOne(
      { _id: new ObjectId(teamId) },
      {
        $set: {
          teamElo: totalElo || fallbackElo,
          teamElos: teamElos,
          updatedAt: new Date(),
        },
      }
    );

    return totalElo || fallbackElo;
  } catch (error) {
    console.error("Error calculating team ELO:", error);
    return 3200; // Default fallback (4 players × 800)
  }
}
