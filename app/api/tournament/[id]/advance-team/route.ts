import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and admin
    if (!session?.user || !session.user.roles?.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournamentId = params.id;
    const body = await request.json();
    const { matchId, winnerId } = body;

    if (!matchId || !winnerId) {
      return NextResponse.json(
        { error: "Match ID and winner ID are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

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
    const match = tournament.tournamentMatches.find(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (!match) {
      return NextResponse.json(
        { error: "Match not found in tournament" },
        { status: 404 }
      );
    }

    // Determine if the winner is teamA or teamB
    const winnerTeam = match.teamA._id === winnerId ? "teamA" : "teamB";

    // Update the match with the winner
    match.status = "completed";
    match.winner = winnerTeam;

    // Find the next match in the next round
    const currentRound = match.roundIndex;
    const currentMatchIndex = match.matchIndex;
    const nextRound = currentRound + 1;
    const nextMatchIndex = Math.floor(currentMatchIndex / 2);

    // Find the next match
    const nextMatch = tournament.tournamentMatches.find(
      (m: any) => m.roundIndex === nextRound && m.matchIndex === nextMatchIndex
    );

    if (nextMatch) {
      // Determine if the winner goes to teamA or teamB slot
      const isTeamASlot = currentMatchIndex % 2 === 0;

      // Get the winning team object
      const winningTeam = winnerTeam === "teamA" ? match.teamA : match.teamB;

      // Update the next match with the winner
      if (isTeamASlot) {
        nextMatch.teamA = winningTeam;
      } else {
        nextMatch.teamB = winningTeam;
      }

      // If both teams are set, update the match status
      if (nextMatch.teamA && nextMatch.teamB) {
        nextMatch.status = "upcoming";
      }
    }

    // Update the tournament
    await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { tournamentMatches: tournament.tournamentMatches } }
      );

    return NextResponse.json({
      success: true,
      message: "Team advanced successfully",
    });
  } catch (error) {
    console.error("Error advancing team:", error);
    return NextResponse.json(
      { error: "Failed to advance team", details: String(error) },
      { status: 500 }
    );
  }
}
