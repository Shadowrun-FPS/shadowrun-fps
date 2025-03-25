import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Need to export a PATCH handler (not just define it)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated (and optionally an admin)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matchId = params.matchId;
    const body = await request.json();
    const { status } = body;

    if (!status || !["upcoming", "in_progress", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
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

    // Update the match status
    tournament.tournamentMatches[matchIndex].status = status;

    // Update the tournament
    await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { [`tournamentMatches.${matchIndex}.status`]: status } }
      );

    return NextResponse.json(tournament.tournamentMatches[matchIndex]);
  } catch (error) {
    console.error("Error updating match status:", error);
    return NextResponse.json(
      { error: "Failed to update match status", details: String(error) },
      { status: 500 }
    );
  }
}
