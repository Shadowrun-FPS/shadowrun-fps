import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add debug logging
    console.log("Session data in fill route:", {
      user: session.user,
      userId: session.user.id,
    });

    // Check if user is an admin
    if (!isAdmin(session.user.id)) {
      console.log("Admin check failed in fill route:", {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "You don't have permission to fill queues" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const reshuffle = searchParams.get("reshuffle") === "true";

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get the queue
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(params.queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Clear existing players if requested to reshuffle
    if (reshuffle && queue.players.length > 0) {
      await db
        .collection("Queues")
        .updateOne(
          { _id: new ObjectId(params.queueId) },
          { $set: { players: [] } }
        );

      // Update queue object to reflect empty players array
      queue.players = [];
    }

    // Get the number of players needed to fill the queue
    const requiredPlayers = queue.teamSize * 2;
    const currentPlayerCount = queue.players.length;
    const neededPlayers = Math.max(0, requiredPlayers - currentPlayerCount);

    if (neededPlayers === 0) {
      return NextResponse.json(
        { message: "Queue is already full" },
        { status: 200 }
      );
    }

    // Get existing player IDs to avoid duplicates
    const existingPlayerIds = queue.players.map(
      (p: { discordId: string }) => p.discordId
    );

    // Find random players with ELO in the queue's range for the specific team size
    const randomPlayers = await db
      .collection("Players")
      .aggregate([
        {
          $match: {
            discordId: { $nin: existingPlayerIds },
            stats: {
              $elemMatch: {
                teamSize: queue.teamSize,
                elo: { $gte: queue.minElo, $lte: queue.maxElo },
              },
            },
          },
        },
        { $sample: { size: neededPlayers } },
      ])
      .toArray();

    if (randomPlayers.length === 0) {
      return NextResponse.json(
        { error: "No eligible players found to fill the queue" },
        { status: 404 }
      );
    }

    // Format players for the queue
    const playersToAdd = randomPlayers.map((player) => {
      const statsForTeamSize = player.stats?.find(
        (s: { teamSize: number }) => s.teamSize === queue.teamSize
      ) || { elo: 1500 };

      return {
        discordId: player.discordId,
        discordUsername: player.discordUsername,
        discordNickname: player.discordNickname || player.discordUsername,
        discordProfilePicture: player.discordProfilePicture || null,
        elo: statsForTeamSize.elo,
        initialElo: statsForTeamSize.elo,
        joinedAt: Date.now(),
      };
    });

    // Add players to the queue
    await db
      .collection("Queues")
      .updateOne({ _id: new ObjectId(params.queueId) }, {
        $push: { players: { $each: playersToAdd } },
      } as any);

    // No need for SSE update logic, just return success
    return NextResponse.json({
      success: true,
      message: `Added ${playersToAdd.length} players to the queue`,
      addedPlayers: playersToAdd.length,
    });
  } catch (error) {
    console.error("Error filling queue:", error);
    return NextResponse.json(
      { error: "Failed to fill queue" },
      { status: 500 }
    );
  }
}
