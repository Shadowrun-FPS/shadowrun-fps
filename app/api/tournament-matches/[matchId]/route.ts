import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params;

    // Debug log to verify the actual matchId being received
    console.log("API route receiving match ID:", matchId);

    const client = await clientPromise;
    const db = client.db();

    // Find the tournament match
    const match = await db.collection("TournamentMatches").findOne({
      tournamentMatchId: matchId,
    });

    if (!match) {
      // Try finding by pattern if the exact match isn't found
      console.log("Match not found by exact ID, trying alternative query");
      const matchPattern = new RegExp(matchId.split("-R")[0], "i");

      const alternativeMatch = await db
        .collection("TournamentMatches")
        .findOne({
          tournamentMatchId: { $regex: matchPattern },
        });

      if (!alternativeMatch) {
        console.log("No match found with either method");
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }

      console.log("Found match with alternative query");
      return NextResponse.json(alternativeMatch);
    }

    console.log("Match found:", match.tournamentMatchId);

    // Enhance with team data
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

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching tournament match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match data" },
      { status: 500 }
    );
  }
}
