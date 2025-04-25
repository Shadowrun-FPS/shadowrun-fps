import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

/**
 * Calculates and updates a team's ELO based on its members
 * @param teamId The MongoDB ObjectId of the team
 * @returns The updated team ELO value
 */
export async function recalculateTeamElo(teamId: string): Promise<number> {
  try {
    const client = await clientPromise;
    const webDb = client.db("ShadowrunWeb");
    const db2 = client.db("ShadowrunDB2");

    // Default individual ELO value
    const DEFAULT_INDIVIDUAL_ELO = 800;

    // Get the team with members
    const team = await webDb.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
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

    // For debugging
    console.log("Team members:", memberIds);

    // Get players data from ShadowrunWeb
    const webPlayers = await webDb
      .collection("Players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // If team size is 4, also get players from ShadowrunDB2
    let db2Players: any[] = [];
    if (configuredTeamSize === 4) {
      db2Players = await db2
        .collection("players")
        .find({ discordId: { $in: memberIds } })
        .toArray();
    }

    // Only calculate ELO for the relevant team size
    const teamElos: Record<string, number> = {};
    const memberElos = [];

    // Calculate ELO for the configured team size
    for (const playerId of memberIds) {
      let playerElo = DEFAULT_INDIVIDUAL_ELO;

      // First check ShadowrunWeb for player stats
      const webPlayer = webPlayers.find((p) => p.discordId === playerId);
      if (webPlayer && webPlayer.stats && Array.isArray(webPlayer.stats)) {
        // Find stats for this team size
        const statForSize = webPlayer.stats.find(
          (s) => s.teamSize === configuredTeamSize
        );

        if (statForSize && typeof statForSize.elo === "number") {
          playerElo = statForSize.elo;
        }
      }

      // For teamSize 4, prioritize DB2 data if available
      if (configuredTeamSize === 4) {
        const db2Player = db2Players.find((p) => p.discordId === playerId);
        if (db2Player && db2Player.rating !== undefined) {
          playerElo = db2Player.rating;
          console.log(`Using DB2 rating for player ${playerId}: ${playerElo}`);
        }
      }

      // Log for debugging
      console.log(
        `Player ${
          webPlayers.find((p) => p.discordId === playerId)?.discordUsername ||
          playerId
        } (size ${configuredTeamSize}v${configuredTeamSize}): ${playerElo}`
      );

      memberElos.push(playerElo);
    }

    // Take top players based on team size
    const sortedElos = [...memberElos].sort((a, b) => b - a);
    const topElos = sortedElos.slice(0, configuredTeamSize);

    // Calculate total team ELO
    const totalElo = topElos.reduce((sum, elo) => sum + elo, 0);
    console.log(
      `Team size ${configuredTeamSize}v${configuredTeamSize} - Total ELO:`,
      totalElo
    );

    teamElos[`size${configuredTeamSize}`] = totalElo;

    // Calculate fallback ELO based on configured team size
    const fallbackElo = DEFAULT_INDIVIDUAL_ELO * configuredTeamSize;

    // Update the team with calculated ELO
    await webDb.collection("Teams").updateOne(
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
