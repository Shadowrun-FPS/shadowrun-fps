import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postSeedQueuesHandler() {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Example queues
    const queues = [
      {
        queueId: "4v4_low",
        gameType: "ranked",
        teamSize: 4,
        players: [],
        eloTier: "low",
        minElo: 800,
        maxElo: 1400,
        status: "active",
      },
      {
        queueId: "4v4_mid",
        gameType: "ranked",
        teamSize: 4,
        players: [],
        eloTier: "mid",
        minElo: 1401,
        maxElo: 2000,
        status: "active",
      },
      {
        queueId: "4v4_high",
        gameType: "ranked",
        teamSize: 4,
        players: [],
        eloTier: "high",
        minElo: 2001,
        maxElo: 3000,
        status: "active",
      },
    ];

    // Insert queues
    await db.collection("Queues").insertMany(queues);

    revalidatePath("/admin/queues");
    revalidatePath("/matches/queues");

    return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postSeedQueuesHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/queues", "/matches/queues"],
});
