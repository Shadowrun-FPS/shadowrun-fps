import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    // Find a tournament with matches
    const tournament = await db.collection("tournaments").findOne({
      "tournamentMatches.0": { $exists: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "No tournaments with matches found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Error fetching sample tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch sample tournament" },
      { status: 500 }
    );
  }
}
