import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const playerId = params.id;
    const teamSize = parseInt(request.nextUrl.searchParams.get("teamSize") || "4");

    // Get all players with stats for this team size, sorted by ELO
    const players = await db
      .collection("Players")
      .find({
        "stats.teamSize": teamSize,
      })
      .toArray();

    // Sort by ELO for this team size
    const sortedPlayers = players
      .map((p) => {
        const stat = p.stats?.find((s: any) => s.teamSize === teamSize);
        return {
          discordId: p.discordId,
          elo: stat?.elo || 0,
        };
      })
      .sort((a, b) => b.elo - a.elo);

    // Find player's position
    const playerIndex = sortedPlayers.findIndex((p) => p.discordId === playerId);
    const position = playerIndex >= 0 ? playerIndex + 1 : null;
    const totalPlayers = sortedPlayers.length;

    // Calculate percentile
    const percentile =
      position && totalPlayers > 0
        ? Math.round(((totalPlayers - position + 1) / totalPlayers) * 100)
        : null;

    return NextResponse.json({
      position,
      totalPlayers,
      percentile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard position" },
      { status: 500 }
    );
  }
}

