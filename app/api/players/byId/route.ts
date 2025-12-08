import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic"; // Mark as dynamic route

async function getPlayerByIdHandler(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? sanitizeString(idParam, 50) : "";

  if (!id) {
    return NextResponse.json({ error: "Missing player ID" }, { status: 400 });
  }

    // Connect to both databases
    const client = await clientPromise;
    const webDb = client.db("ShadowrunWeb");
    const db2 = client.db("ShadowrunDB2");

    // Get player from original database
    const webPlayer = await webDb
      .collection("Players")
      .findOne({ discordId: id });

    if (!webPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Check if player exists in ShadowrunDB2
    const db2Player = await db2
      .collection("players")
      .findOne({ discordId: id });

    // Create a copy of the player to modify
    const player = { ...webPlayer };

    // Initialize stats array if it doesn't exist
    if (!player.stats) {
      player.stats = [];
    } else {
      // Make a copy of the stats array
      player.stats = [...player.stats];
    }

    // If db2Player exists, update the teamSize 4 stats with data from ShadowrunDB2
    if (db2Player && db2Player.rating !== undefined) {
      // Find the index of teamSize 4 stats
      const team4Index = player.stats.findIndex(
        (stat: { teamSize: number }) => stat.teamSize === 4
      );

      const db2Stats = {
        teamSize: 4,
        elo: db2Player.rating,
        wins: db2Player.wins || 0,
        losses: db2Player.losses || 0,
        lastMatchDate: db2Player.lastMatchDate,
      };

      if (team4Index >= 0) {
        // Replace existing teamSize 4 stats
        player.stats[team4Index] = db2Stats;
      } else {
        // Add new teamSize 4 stats
        player.stats.push(db2Stats);
      }
    }

    const response = NextResponse.json(player);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=1800"
    );
    return response;
}

export const GET = withApiSecurity(getPlayerByIdHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});
