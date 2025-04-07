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

    // Clear team information from all matches
    const updatedMatches = tournament.tournamentMatches.map((match: any) => {
      return {
        ...match,
        teamA: null,
        teamB: null,
        winner: null,
        mapScores: [],
        status: "upcoming",
      };
    });

    // Update the tournament
    await db
      .collection("Tournaments")
      .updateOne(
        { _id: new ObjectId(tournamentId) },
        { $set: { tournamentMatches: updatedMatches } }
      );

    return NextResponse.json({
      success: true,
      message: "Teams unseeded successfully",
    });
  } catch (error) {
    console.error("Error unseeding teams:", error);
    return NextResponse.json(
      { error: "Failed to unseed teams", details: String(error) },
      { status: 500 }
    );
  }
}
