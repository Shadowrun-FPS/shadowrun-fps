import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sanitizeString } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity } from "@/lib/api-wrapper";
import {
  db2PlayerDocToSlice,
  mergeFourVsFourFromDb2,
} from "@/lib/merge-db2-four-vs-four";

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

      const db2Slice = db2PlayerDocToSlice(db2Player);
      if (db2Slice) {
        const team4Index = stats.findIndex((stat) => stat.teamSize === 4);
        const existingWeb4 =
          team4Index >= 0 ? stats[team4Index] : undefined;
        const merged4 = mergeFourVsFourFromDb2(existingWeb4, db2Slice);

        if (team4Index >= 0) {
          stats[team4Index] = merged4;
        } else {
          stats.push(merged4);
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
