import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { calculateElo } from "@/lib/elo";

export async function PUT(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { status, scores, playerStats } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Update match status and scores
    const result = await db.collection("Matches").findOneAndUpdate(
      { _id: new ObjectId(params.matchId) },
      {
        $set: {
          status,
          scores,
          playerStats,
          completedAt: status === "completed" ? new Date() : undefined,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Match update failed" },
        { status: 500 }
      );
    }

    const match = result.value;
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (status === "completed") {
      // Calculate team average ELOs
      const team1Avg =
        match.players
          .filter((p: any) => p.team === 1)
          .reduce((sum: number, p: any) => sum + p.elo, 0) /
        (match.players.length / 2);

      const team2Avg =
        match.players
          .filter((p: any) => p.team === 2)
          .reduce((sum: number, p: any) => sum + p.elo, 0) /
        (match.players.length / 2);

      // Determine winner
      const team1Won = scores.team1 > scores.team2;

      // Update each player's ELO
      for (const player of match.players) {
        const isTeam1 = player.team === 1;
        const playerWon = (isTeam1 && team1Won) || (!isTeam1 && !team1Won);
        const opponentAvg = isTeam1 ? team2Avg : team1Avg;

        const newElo = calculateElo(
          player.elo,
          opponentAvg,
          playerWon ? "win" : "loss"
        );

        // Update player stats
        await db.collection("Players").updateOne(
          { discordId: player.discordId },
          {
            $set: { elo: newElo },
            $inc: {
              wins: playerWon ? 1 : 0,
              losses: playerWon ? 0 : 1,
              totalKills: playerStats[player.discordId]?.kills || 0,
              totalDeaths: playerStats[player.discordId]?.deaths || 0,
              totalAssists: playerStats[player.discordId]?.assists || 0,
            },
          }
        );
      }
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Failed to update match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}
