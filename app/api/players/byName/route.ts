import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import {
  db2PlayerDocToSlice,
  mergeFourVsFourFromDb2,
} from "@/lib/merge-db2-four-vs-four";

export const dynamic = "force-dynamic"; // Mark as dynamic route

async function getPlayerByNameHandler(request: NextRequest) {
  const nameParam = request.nextUrl.searchParams.get("name");
  const name = nameParam ? sanitizeString(nameParam, 100) : "";

  if (!name) {
    return NextResponse.json(
      { error: "Missing player name" },
      { status: 400 }
    );
  }

    // Connect to both databases
    const client = await clientPromise;
    const webDb = client.db("ShadowrunWeb");
    const db2 = client.db("ShadowrunDB2");

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const webPlayer = await webDb.collection("Players").findOne({
      discordUsername: { $regex: new RegExp(`^${escapedName}$`, "i") },
    });

    if (!webPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Check if player exists in ShadowrunDB2
    const db2Player = await db2.collection("players").findOne({
      discordId: webPlayer.discordId,
    });

    // Create a copy of the player to modify
    const player = { ...webPlayer };

    // Initialize stats array if it doesn't exist
    if (!player.stats) {
      player.stats = [];
    } else {
      // Make a copy of the stats array
      player.stats = [...player.stats];
    }

    // If db2Player exists, merge ShadowrunDB2 4v4 ladder into Web stats (keep Web lastMatchDate if DB2 omits it)
    const db2Slice = db2PlayerDocToSlice(db2Player);
    if (db2Slice) {
      const team4Index = player.stats.findIndex(
        (stat: { teamSize: number }) => stat.teamSize === 4
      );
      const existingWeb4 =
        team4Index >= 0 ? player.stats[team4Index] : undefined;
      const merged4 = mergeFourVsFourFromDb2(existingWeb4, db2Slice);

      if (team4Index >= 0) {
        player.stats[team4Index] = merged4;
      } else {
        player.stats.push(merged4);
      }
    }

    const response = NextResponse.json(player);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=1800"
    );
    return response;
}

export const GET = withApiSecurity(getPlayerByNameHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});
