import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getPlayerHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const discordId = sanitizeString(id, 50);

  if (!discordId) {
    return NextResponse.json(
      { error: "Player ID is required" },
      { status: 400 }
    );
  }

  const result = await cachedQuery(
    `player:${discordId}`,
    async () => {
      const client = await clientPromise;
      const webDb = client.db("ShadowrunWeb");
      const db2 = client.db("ShadowrunDB2");

      const webPlayer = await webDb.collection("Players").findOne({ discordId });

      if (!webPlayer) {
        return null;
      }

      const db2Player = await db2.collection("players").findOne({ discordId });
      const stats = [...(webPlayer.stats || [])];

      if (db2Player && db2Player.rating !== undefined) {
        const team4Index = stats.findIndex((stat) => stat.teamSize === 4);
        const db2Stats = {
          teamSize: 4,
          elo: db2Player.rating,
          wins: db2Player.wins || 0,
          losses: db2Player.losses || 0,
          lastMatchDate: db2Player.lastMatchDate,
        };

        if (team4Index >= 0) {
          stats[team4Index] = db2Stats;
        } else {
          stats.push(db2Stats);
        }
      }

      return {
        discordId: webPlayer.discordId,
        discordUsername: webPlayer.discordUsername,
        discordNickname: webPlayer.discordNickname,
        discordProfilePicture: webPlayer.discordProfilePicture,
        stats: stats,
      };
    },
    2 * 60 * 1000 // Cache for 2 minutes
  );

  if (!result) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}

export const GET = withApiSecurity(getPlayerHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 120,
});
