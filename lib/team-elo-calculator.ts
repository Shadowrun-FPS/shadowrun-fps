import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Calculates and updates a team's ELO based on its members
 * @param teamId The MongoDB ObjectId of the team
 * @returns The updated team ELO value
 */
export async function recalculateTeamElo(teamId: string) {
  const { db } = await connectToDatabase();

  // Get the team
  const team = await db.collection("Teams").findOne({
    _id: new ObjectId(teamId),
  });

  if (!team) {
    throw new Error("Team not found");
  }

  // Get all team members' IDs
  const memberIds = team.members.map((member: any) => member.discordId);

  // Get all players' data
  const players = await db
    .collection("Players")
    .find({ discordId: { $in: memberIds } })
    .toArray();

  // Calculate average ELO
  let totalElo = 0;
  let playerCount = 0;

  for (const player of players) {
    // Use the player's ELO or default to 1000
    const playerElo = player.elo || 1000;
    totalElo += playerElo;
    playerCount++;
  }

  // Calculate average (default to 1000 if no players found)
  const averageElo =
    playerCount > 0 ? Math.round(totalElo / playerCount) : 1000;

  // Update the team's ELO
  await db
    .collection("Teams")
    .updateOne(
      { _id: new ObjectId(teamId) },
      { $set: { teamElo: averageElo, updatedAt: new Date() } }
    );

  return averageElo;
}
