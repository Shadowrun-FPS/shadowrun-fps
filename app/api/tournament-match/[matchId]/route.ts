import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;

    // Extract tournament ID from the match ID
    const tournamentId = matchId.split("-R")[0];

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

    // Add tournament info to the match
    match.tournament = {
      name: tournament.name,
      format: tournament.format,
      _id: tournament._id.toString(),
    };

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match", details: String(error) },
      { status: 500 }
    );
  }
}
