import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const discordId = params.id;

    if (!discordId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    // Connect to both databases
    const client = await clientPromise;
    const webDb = client.db("ShadowrunWeb");
    const db2 = client.db("ShadowrunDB2");

    // Get player from original database
    const webPlayer = await webDb.collection("Players").findOne({ discordId });

    if (!webPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Check if player exists in ShadowrunDB2
    const db2Player = await db2.collection("players").findOne({ discordId });

    // Create a copy of the webPlayer stats to modify
    const stats = [...(webPlayer.stats || [])];

    // If db2Player exists, update the teamSize 4 stats with data from ShadowrunDB2
    if (db2Player && db2Player.rating !== undefined) {
      // Find the index of teamSize 4 stats
      const team4Index = stats.findIndex((stat) => stat.teamSize === 4);

      const db2Stats = {
        teamSize: 4,
        elo: db2Player.rating,
        wins: db2Player.wins || 0,
        losses: db2Player.losses || 0,
        lastMatchDate: db2Player.lastMatchDate,
      };

      if (team4Index >= 0) {
        // Replace existing teamSize 4 stats
        stats[team4Index] = db2Stats;
      } else {
        // Add new teamSize 4 stats
        stats.push(db2Stats);
      }
    }

    return NextResponse.json({
      discordId: webPlayer.discordId,
      discordUsername: webPlayer.discordUsername,
      discordNickname: webPlayer.discordNickname,
      discordProfilePicture: webPlayer.discordProfilePicture,
      stats: stats,
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 }
    );
  }
}
