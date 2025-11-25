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

    // Enhance with team data - search across all collections
    const { findTeamAcrossCollections } = await import("@/lib/team-collections");
    
    if (match.teamA?._id) {
      const teamAId = typeof match.teamA._id === "string" ? match.teamA._id : match.teamA._id.toString();
      const teamAResult = await findTeamAcrossCollections(db, teamAId);

      if (teamAResult) {
        match.teamA = {
          ...match.teamA,
          ...teamAResult.team,
          _id: teamAResult.team._id.toString(),
        };
      }
    }

    if (match.teamB?._id) {
      const teamBId = typeof match.teamB._id === "string" ? match.teamB._id : match.teamB._id.toString();
      const teamBResult = await findTeamAcrossCollections(db, teamBId);

      if (teamBResult) {
        match.teamB = {
          ...match.teamB,
          ...teamBResult.team,
          _id: teamBResult.team._id.toString(),
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
