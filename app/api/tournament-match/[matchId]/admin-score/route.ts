import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and admin
    if (!session?.user || !session.user.roles?.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matchId = params.matchId;
    const body = await request.json();
    const { mapIndex, teamAScore, teamBScore } = body;

    // Validate scores
    if (teamAScore > 6 || teamBScore > 6) {
      return NextResponse.json(
        { error: "Maximum score per map is 6 rounds" },
        { status: 400 }
      );
    }

    if (teamAScore === 6 && teamBScore === 6) {
      return NextResponse.json(
        { error: "Both teams cannot have 6 rounds" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Extract tournament ID from the match ID
    const tournamentId = matchId.split("-R")[0];

    // Find the tournament
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Find the match in the tournament
    const matchIndex = tournament.tournamentMatches.findIndex(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (matchIndex === -1) {
      return NextResponse.json(
        { error: "Match not found in tournament" },
        { status: 404 }
      );
    }

    // Update or add the map score
    const match = tournament.tournamentMatches[matchIndex];
    if (!match.mapScores) {
      match.mapScores = [];
    }

    if (!match.mapScores[mapIndex]) {
      match.mapScores[mapIndex] = {};
    }

    match.mapScores[mapIndex] = {
      teamAScore,
      teamBScore,
      winner:
        teamAScore > teamBScore
          ? "teamA"
          : teamBScore > teamAScore
          ? "teamB"
          : "tie",
    };

    // Check if match is complete (best of 3)
    const teamAWins = match.mapScores.filter(
      (score: any) => score.winner === "teamA"
    ).length;

    const teamBWins = match.mapScores.filter(
      (score: any) => score.winner === "teamB"
    ).length;

    if (teamAWins >= 2 || teamBWins >= 2) {
      match.status = "completed";
      match.winner = teamAWins >= 2 ? "teamA" : "teamB";
    }

    // Update the tournament
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      {
        $set: {
          [`tournamentMatches.${matchIndex}`]: match,
        },
      }
    );

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error submitting admin scores:", error);
    return NextResponse.json(
      { error: "Failed to submit scores", details: String(error) },
      { status: 500 }
    );
  }
}
