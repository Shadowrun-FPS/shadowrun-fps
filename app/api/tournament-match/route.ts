import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // Extract matchId from search params
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get("id");

    console.log("Direct API route receiving match ID:", matchId);

    if (
      !matchId ||
      matchId === "[matchId]" ||
      matchId === "%5BmatchId%5D" ||
      matchId === "%255BmatchId%255D"
    ) {
      console.error("Invalid match ID format:", matchId);
      return NextResponse.json(
        { error: "Invalid match ID format" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Extract the tournament ID from the match ID (everything before -R1-M1)
    const tournamentId = matchId.split("-R")[0];
    console.log("Extracted tournament ID:", tournamentId);

    // Find the tournament first
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      console.log("Tournament not found with ID:", tournamentId);
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    console.log("Found tournament:", tournament.name);
    console.log(
      "Tournament has matches:",
      tournament.tournamentMatches?.length || 0
    );

    // Find the specific match within the tournament
    if (
      !tournament.tournamentMatches ||
      tournament.tournamentMatches.length === 0
    ) {
      return NextResponse.json(
        { error: "No matches found in tournament" },
        { status: 404 }
      );
    }

    // Look for the match with the matching tournamentMatchId
    const match = tournament.tournamentMatches.find(
      (m: { tournamentMatchId: string }) => m.tournamentMatchId === matchId
    );

    if (!match) {
      console.log(
        "Match not found in tournament, available matches:",
        tournament.tournamentMatches.map(
          (m: { tournamentMatchId: string }) => m.tournamentMatchId
        )
      );

      return NextResponse.json(
        {
          error: "Match not found in tournament",
          availableMatches: tournament.tournamentMatches.map(
            (m: { tournamentMatchId: string }) => m.tournamentMatchId
          ),
        },
        { status: 404 }
      );
    }

    console.log("Match found:", match.tournamentMatchId);

    // Enhance with additional team data if needed
    if (match.teamA?._id) {
      const teamA = await db.collection("Teams").findOne({
        _id:
          typeof match.teamA._id === "string"
            ? new ObjectId(match.teamA._id)
            : match.teamA._id,
      });

      if (teamA) {
        match.teamA = {
          ...match.teamA,
          ...teamA,
          _id: teamA._id.toString(),
        };
      }
    }

    if (match.teamB?._id) {
      const teamB = await db.collection("Teams").findOne({
        _id:
          typeof match.teamB._id === "string"
            ? new ObjectId(match.teamB._id)
            : match.teamB._id,
      });

      if (teamB) {
        match.teamB = {
          ...match.teamB,
          ...teamB,
          _id: teamB._id.toString(),
        };
      }
    }

    // Add tournament info to the response
    match.tournament = {
      name: tournament.name,
      format: tournament.format,
      _id: tournament._id.toString(),
    };

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error in direct tournament match endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch match data", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Similar logic to GET but handles the POST-specific operations
    // ...

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST tournament match endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: String(error) },
      { status: 500 }
    );
  }
}
