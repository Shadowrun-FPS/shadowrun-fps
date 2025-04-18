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
    const db = client.db();

    // Default individual ELO value
    const DEFAULT_INDIVIDUAL_ELO = 800;

    // Get the team with members
    const team = await db.collection("Teams").findOne({
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

    // Get players data
    const players = await db
      .collection("Players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Only calculate ELO for the relevant team size
    const teamElos: Record<string, number> = {};
    const memberElos = [];

    // Calculate ELO for the configured team size
    for (const playerId of memberIds) {
      const player = players.find((p) => p.discordId === playerId);
      if (player && player.stats && Array.isArray(player.stats)) {
        // Find stats for this team size
        const statForSize = player.stats.find(
          (s) => s.teamSize === configuredTeamSize
        );

        // Log for debugging
        console.log(
          `Player ${
            player.discordUsername || playerId
          } (size ${configuredTeamSize}v${configuredTeamSize}):`,
          statForSize ? statForSize.elo : "No ELO data"
        );

        if (statForSize && typeof statForSize.elo === "number") {
          memberElos.push(statForSize.elo);
        } else {
          memberElos.push(DEFAULT_INDIVIDUAL_ELO); // Default individual ELO
        }
      } else {
        memberElos.push(DEFAULT_INDIVIDUAL_ELO); // Default for players without stats
      }
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
    await db.collection("Teams").updateOne(
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
