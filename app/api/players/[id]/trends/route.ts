import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const playerId = id;
    const teamSize = parseInt(request.nextUrl.searchParams.get("teamSize") || "4");
    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");

    // Get matches for this player in the specified time period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matches = await db
      .collection("Matches")
      .find({
        $and: [
          {
            $or: [
              { "teamA.players.discordId": playerId },
              { "teamB.players.discordId": playerId },
              { "team1.players.discordId": playerId },
              { "team2.players.discordId": playerId },
              { "teams.teamA": playerId },
              { "teams.teamB": playerId },
            ],
          },
          {
            $or: [
              { completedAt: { $gte: startDate } },
              { createdAt: { $gte: startDate } },
              { playedAt: { $gte: startDate } },
            ],
          },
        ],
        status: { $in: ["completed", "confirmed"] },
        teamSize: teamSize,
      })
      .sort({ completedAt: 1, createdAt: 1, playedAt: 1 })
      .toArray();

    // Build ELO trend data
    const trends = matches
      .map((match: any) => {
        let playerTeam: string;
        let playerElo = 0;

        // Determine team structure
        if (match.teamA?.players || match.teamB?.players) {
          const inTeamA = match.teamA?.players?.some(
            (p: any) => p.discordId === playerId
          );
          playerTeam = inTeamA ? "teamA" : "teamB";
          playerElo =
            match[playerTeam]?.players?.find(
              (p: any) => p.discordId === playerId
            )?.elo || 0;
        } else if (match.team1?.players || match.team2?.players) {
          const inTeam1 = match.team1?.players?.some(
            (p: any) => p.discordId === playerId
          );
          playerTeam = inTeam1 ? "team1" : "team2";
          playerElo =
            match[playerTeam]?.players?.find(
              (p: any) => p.discordId === playerId
            )?.elo || 0;
        } else {
          return null;
        }

        const eloChange = match.eloChanges?.[playerId] || 0;
        const playerWon =
          match.winner === playerTeam ||
          match.winner === (playerTeam === "team1" ? 1 : 2);

        return {
          date: match.completedAt || match.createdAt || match.playedAt,
          elo: playerElo - eloChange, // ELO before the match
          eloChange,
          result: playerWon ? "win" : "loss",
        };
      })
      .filter((t) => t !== null);

    return NextResponse.json({ trends });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch performance trends" },
      { status: 500 }
    );
  }
}

