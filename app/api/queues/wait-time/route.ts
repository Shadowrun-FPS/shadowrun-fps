import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getWaitTimeHandler(req: NextRequest) {
  const gameTypeParam = req.nextUrl.searchParams.get("gameType");
  const eloTierParam = req.nextUrl.searchParams.get("eloTier");

  const gameType = gameTypeParam ? sanitizeString(gameTypeParam, 50) : null;
  const eloTier = eloTierParam ? sanitizeString(eloTierParam, 50) : null;

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get recent matches for this queue type
    const recentMatches = await db
      .collection("Matches")
      .find({
        gameType,
        eloTier,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      })
      .toArray();

    if (recentMatches.length === 0) {
      return NextResponse.json({ estimatedWaitTime: null });
    }

    // Calculate average time to fill queue
    const waitTimes = recentMatches.map((match) => {
      const firstPlayer = Math.min(
        ...match.team1.players
          .concat(match.team2.players)
          .map((p: any) => new Date(p.joinedAt).getTime())
      );
      return new Date(match.createdAt).getTime() - firstPlayer;
    });

    const averageWaitTime =
      waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;

    // Get current queue state
    const currentQueue = await db.collection("Queues").findOne({
      gameType,
      eloTier,
    });

    if (!currentQueue) {
      return NextResponse.json({ estimatedWaitTime: null });
    }

    // Adjust wait time based on current queue size
    const queueFullSize = currentQueue.teamSize * 2;
    const currentSize = currentQueue.players.length;
    const remainingPlayers = queueFullSize - currentSize;

    const estimatedWaitTime =
      (averageWaitTime * remainingPlayers) / queueFullSize;

    const response = NextResponse.json({ estimatedWaitTime });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
}

export const GET = withApiSecurity(getWaitTimeHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 60,
});
