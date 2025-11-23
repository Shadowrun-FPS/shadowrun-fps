import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (!session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const { db } = await connectToDatabase();

    // Get the tournament
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Update all bracket matches to "upcoming" status
    const updateOperations: Record<string, any> = {};

    // Reset winners bracket
    if (tournament.brackets && tournament.brackets.rounds) {
      tournament.brackets.rounds.forEach((round: any, roundIndex: number) => {
        if (round.matches) {
          round.matches.forEach((match: any, matchIndex: number) => {
            // Reset match status and scores
            updateOperations[
              `brackets.rounds.${roundIndex}.matches.${matchIndex}.status`
            ] = "upcoming";
            updateOperations[
              `brackets.rounds.${roundIndex}.matches.${matchIndex}.scores.teamA`
            ] = 0;
            updateOperations[
              `brackets.rounds.${roundIndex}.matches.${matchIndex}.scores.teamB`
            ] = 0;
            updateOperations[
              `brackets.rounds.${roundIndex}.matches.${matchIndex}.winner`
            ] = null;

            // Only keep teamA and teamB for the first round, remove them from later rounds
            if (roundIndex > 0) {
              updateOperations[
                `brackets.rounds.${roundIndex}.matches.${matchIndex}.teamA`
              ] = null;
              updateOperations[
                `brackets.rounds.${roundIndex}.matches.${matchIndex}.teamB`
              ] = null;
            }
          });
        }
      });
    }

    // Reset losers bracket for double elimination tournaments
    // Completely clear the losersRounds structure so it can be recreated correctly on re-seed
    if (tournament.format === "double_elimination") {
      updateOperations["brackets.losersRounds"] = [];
    }

    // Clear all tournament matches and reset tournament status
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "upcoming",
          ...updateOperations,
        },
        $unset: { tournamentMatches: "" },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Tournament reset successfully",
    });
  } catch (error) {
    console.error("Error resetting tournament:", error);
    return NextResponse.json(
      { error: "Failed to reset tournament" },
      { status: 500 }
    );
  }
}
