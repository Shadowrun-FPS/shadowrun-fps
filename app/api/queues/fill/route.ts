import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get all players with their profile pictures
    const players = await db.collection("Players").find({}).toArray();

    // Log a sample player to verify the data structure
    console.log(
      "Sample player from Players collection:",
      players.find((p) => p.discordId === "238329746671271936")
    );

    // Get all queues
    const queues = await db.collection("Queues").find({}).toArray();

    // Update each queue with random players
    const updatePromises = queues.map(async (queue) => {
      // Get random players that match the ELO tier
      const eligiblePlayers = players.filter((player) => {
        const playerElo = player.stats?.[queue.teamSize]?.elo || 1500;
        const [minElo, maxElo] = queue.eloTier.split("-").map(Number);
        return playerElo >= minElo && playerElo <= maxElo;
      });

      // Log eligible players to verify data
      console.log(
        "Eligible players with their profile pictures:",
        eligiblePlayers.map((p) => ({
          discordId: p.discordId,
          discordProfilePicture: p.discordProfilePicture,
        }))
      );

      // Randomly select players up to max size
      const selectedPlayers = eligiblePlayers
        .sort(() => Math.random() - 0.5)
        .slice(0, queue.teamSize * 2)
        .map((player) => {
          // Log individual player data during mapping
          console.log("Mapping player data:", {
            id: player.discordId,
            profilePic: player.discordProfilePicture,
          });

          // Find the player's ELO for this team size
          const playerElo =
            player.stats?.find(
              (s: { teamSize: number }) => s.teamSize === queue.teamSize
            )?.elo || 1500;

          return {
            discordId: player.discordId,
            discordUsername: player.discordUsername,
            discordNickname: player.discordNickname || player.discordUsername,
            discordProfilePicture: player.discordProfilePicture || null,
            elo: playerElo,
            initialElo: playerElo,
            joinedAt: Date.now(),
          };
        });

      // Log selected players before updating queue
      console.log(
        "Selected players before queue update:",
        selectedPlayers.map((p) => ({
          discordId: p.discordId,
          discordProfilePicture: p.discordProfilePicture,
        }))
      );

      // Update queue with selected players
      await db
        .collection("Queues")
        .updateOne({ _id: queue._id }, { $set: { players: selectedPlayers } });

      // Verify the update
      const updatedQueue = await db
        .collection("Queues")
        .findOne({ _id: queue._id });
      console.log("Queue after update:", updatedQueue);

      return updatedQueue;
    });

    await Promise.all(updatePromises);

    // Get updated queues to return
    const updatedQueues = await db.collection("Queues").find({}).toArray();

    return NextResponse.json({
      success: true,
      message: "Queue filled successfully",
      queues: updatedQueues,
    });
  } catch (error) {
    console.error("Error filling queue:", error);
    return NextResponse.json(
      { error: "Failed to fill queue" },
      { status: 500 }
    );
  }
}
