import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postFillQueueHandler(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.id)) {
    safeLog.warn("Admin check failed in fill route:", {
      userId: session.user.id,
    });
      return NextResponse.json(
        { error: "You don't have permission to fill queues" },
        { status: 403 }
      );
    }

    const queueId = sanitizeString(params.queueId, 50);
    if (!ObjectId.isValid(queueId)) {
      return NextResponse.json(
        { error: "Invalid queue ID" },
        { status: 400 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const reshuffle = searchParams.get("reshuffle") === "true";

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    if (reshuffle && queue.players.length > 0) {
      await db
        .collection("Queues")
        .updateOne(
          { _id: new ObjectId(queueId) },
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

    const playersToAdd = randomPlayers.map((player) => {
      const statsForTeamSize = player.stats?.find(
        (s: { teamSize: number }) => s.teamSize === queue.teamSize
      ) || { elo: 1500 };

      return {
        discordId: sanitizeString(player.discordId, 50),
        discordUsername: sanitizeString(player.discordUsername || "", 100),
        discordNickname: sanitizeString(player.discordNickname || player.discordUsername || "", 100),
        discordProfilePicture: player.discordProfilePicture ? sanitizeString(player.discordProfilePicture, 255) : null,
        elo: typeof statsForTeamSize.elo === "number" ? Math.max(0, Math.min(10000, statsForTeamSize.elo)) : 1500,
        initialElo: typeof statsForTeamSize.elo === "number" ? Math.max(0, Math.min(10000, statsForTeamSize.elo)) : 1500,
        joinedAt: Date.now(),
      };
    });

    await db
      .collection("Queues")
      .updateOne({ _id: new ObjectId(queueId) }, {
        $push: { players: { $each: playersToAdd } },
      } as any);

    revalidatePath("/admin/queues");
    revalidatePath("/matches/queues");

    return NextResponse.json({
      success: true,
      message: `Added ${playersToAdd.length} players to the queue`,
      addedPlayers: playersToAdd.length,
    });
}

export const POST = withApiSecurity(postFillQueueHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/queues", "/matches/queues"],
});
