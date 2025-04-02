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

    console.log("Starting tournament:", tournamentId);

    // Create a copy of the tournament for modification
    const updatedTournament = { ...tournament };
    const newStatus = "in_progress";

    // 1. Update the main tournament status
    updatedTournament.status = newStatus;
    console.log("Main tournament status set to:", newStatus);

    // 2. Update all Round 1 matches in tournamentMatches
    if (
      updatedTournament.tournamentMatches &&
      Array.isArray(updatedTournament.tournamentMatches)
    ) {
      updatedTournament.tournamentMatches =
        updatedTournament.tournamentMatches.map((match) => {
          if (match.roundIndex === 0) {
            console.log(
              `Updating tournamentMatch status: ${match.tournamentMatchId}`
            );
            return { ...match, status: newStatus };
          }
          return match;
        });
      console.log("tournamentMatches updated");
    }

    // 3. Update all matches in brackets.rounds[0].matches
    if (
      updatedTournament.brackets &&
      updatedTournament.brackets.rounds &&
      Array.isArray(updatedTournament.brackets.rounds) &&
      updatedTournament.brackets.rounds[0] &&
      updatedTournament.brackets.rounds[0].matches &&
      Array.isArray(updatedTournament.brackets.rounds[0].matches)
    ) {
      updatedTournament.brackets.rounds[0].matches =
        updatedTournament.brackets.rounds[0].matches.map(
          (match: { matchId: any; tournamentMatchId: any }) => {
            console.log(
              `Updating bracket match status: ${
                match.matchId || match.tournamentMatchId
              }`
            );
            return { ...match, status: newStatus };
          }
        );
      console.log("brackets.rounds[0].matches updated");
    }

    // 4. Save the entire updated tournament document
    await db
      .collection("Tournaments")
      .replaceOne({ _id: new ObjectId(tournamentId) }, updatedTournament);

    console.log("Tournament document replaced with updated statuses");

    return NextResponse.json({
      success: true,
      message: "Tournament started successfully",
      updatedTournament: {
        ...updatedTournament,
        _id: updatedTournament._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error starting tournament:", error);
    return NextResponse.json(
      { error: "Failed to start tournament", details: String(error) },
      { status: 500 }
    );
  }
}
