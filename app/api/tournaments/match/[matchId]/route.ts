import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params;

    const { db } = await connectToDatabase();

    // Find the tournament containing this match
    const tournament = await db
      .collection("Tournaments")
      .findOne(
        { "tournamentMatches.tournamentMatchId": matchId },
        { projection: { tournamentMatches: 1, name: 1 } }
      );

    if (!tournament) {
      console.log(`No tournament found with match ID: ${matchId}`);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Find the specific match in the tournament
    const match = tournament.tournamentMatches.find(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (!match) {
      console.log(`Match ${matchId} not found in tournament`);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({
      match,
      tournamentName: tournament.name,
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}
