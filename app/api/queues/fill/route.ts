import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postFillHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isAdmin(session.user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const players = await db.collection("Players").find({}).toArray();

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

    const selectedPlayers = eligiblePlayers
      .sort(() => Math.random() - 0.5)
      .slice(0, queue.teamSize * 2)
      .map((player) => {
        // Find the player's ELO for this team size
        const playerElo =
          player.stats?.find(
            (s: { teamSize: number }) => s.teamSize === queue.teamSize
          )?.elo || 1500;

        return {
          discordId: player.discordId,
          discordUsername: sanitizeString(player.discordUsername || "", 100),
          discordNickname: sanitizeString(
            player.discordNickname || player.discordUsername || "",
            100
          ),
          discordProfilePicture: player.discordProfilePicture || null,
          elo: playerElo,
          initialElo: playerElo,
          joinedAt: Date.now(),
        };
      });

    await db
      .collection("Queues")
      .updateOne({ _id: queue._id }, { $set: { players: selectedPlayers } });

    return updatedQueues;
  });

  await Promise.all(updatePromises);

  // Get updated queues to return
  const updatedQueues = await db.collection("Queues").find({}).toArray();

  revalidatePath("/matches/queues");
  revalidatePath("/admin/queues");

  return NextResponse.json({
    success: true,
    message: "Queue filled successfully",
    queues: updatedQueues,
  });
}

export const POST = withApiSecurity(postFillHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
