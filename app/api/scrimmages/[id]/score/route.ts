import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mapIndex, teamAScore, teamBScore, submittingTeam } =
      await request.json();

    if (
      typeof mapIndex !== "number" ||
      typeof teamAScore !== "number" ||
      typeof teamBScore !== "number" ||
      !["teamA", "teamB"].includes(submittingTeam)
    ) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get the scrimmage
    const scrimmage = await db.collection("scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Verify user is authorized to submit scores
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamACaptain =
      session.user.id === scrimmage.challengingTeam?.captain?.discordId;
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId;

    if (!isAdmin && !isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        { error: "You are not authorized to submit scores" },
        { status: 403 }
      );
    }

    // Validate scores
    if (teamAScore > 6 || teamBScore > 6) {
      return NextResponse.json(
        { error: "Maximum score per map is 6 rounds" },
        { status: 400 }
      );
    }

    if (teamAScore === 6 && teamBScore === 6) {
      return NextResponse.json(
        { error: "Both teams cannot have 6 rounds" },
        { status: 400 }
      );
    }

    // Initialize mapScores array if it doesn't exist
    if (!scrimmage.mapScores) {
      await db.collection("scrimmages").updateOne(
        { _id: new ObjectId(params.id) },
        {
          $set: {
            mapScores: Array(scrimmage.maps.length).fill({
              teamAScore: 0,
              teamBScore: 0,
            }),
          },
        }
      );
    }

    // Update the map score for the submitting team
    const updateField =
      submittingTeam === "teamA" ? "teamASubmitted" : "teamBSubmitted";
    const updateData: any = {};
    updateData[`mapScores.${mapIndex}.teamAScore`] = teamAScore;
    updateData[`mapScores.${mapIndex}.teamBScore`] = teamBScore;
    updateData[`mapScores.${mapIndex}.${updateField}`] = true;

    // Update the scrimmage
    await db
      .collection("scrimmages")
      .updateOne({ _id: new ObjectId(params.id) }, { $set: updateData });

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    // Add null check before accessing properties
    if (!updatedScrimmage) {
      return NextResponse.json(
        { error: "Failed to retrieve updated scrimmage" },
        { status: 500 }
      );
    }

    // Check if both teams have submitted scores for this map
    if (
      updatedScrimmage.mapScores &&
      updatedScrimmage.mapScores[mapIndex] &&
      updatedScrimmage.mapScores[mapIndex].teamASubmitted &&
      updatedScrimmage.mapScores[mapIndex].teamBSubmitted
    ) {
      // Verify scores match
      const teamASubmittedScore =
        updatedScrimmage.mapScores[mapIndex].teamAScore;
      const teamBSubmittedScore =
        updatedScrimmage.mapScores[mapIndex].teamBScore;

      // If scores match, determine the winner
      if (
        teamAScore === teamASubmittedScore &&
        teamBScore === teamBSubmittedScore
      ) {
        let winner = null;
        if (teamAScore > teamBScore) {
          winner = "teamA";
        } else if (teamBScore > teamAScore) {
          winner = "teamB";
        }

        // Update the map winner
        await db
          .collection("scrimmages")
          .updateOne(
            { _id: new ObjectId(params.id) },
            { $set: { [`mapScores.${mapIndex}.winner`]: winner } }
          );

        // Check if match is complete (one team has won 2 maps)
        const updatedWithWinner = await db.collection("scrimmages").findOne({
          _id: new ObjectId(params.id),
        });

        // Add null check before accessing properties
        if (!updatedWithWinner || !updatedWithWinner.mapScores) {
          return NextResponse.json(
            { error: "Failed to retrieve updated scrimmage with winner" },
            { status: 500 }
          );
        }

        const teamAWins = updatedWithWinner.mapScores.filter(
          (score: any) => score.winner === "teamA"
        ).length;

        const teamBWins = updatedWithWinner.mapScores.filter(
          (score: any) => score.winner === "teamB"
        ).length;

        // If one team has won 2 maps, the match is complete
        if (teamAWins >= 2 || teamBWins >= 2) {
          const matchWinner = teamAWins >= 2 ? "teamA" : "teamB";
          const winningTeamId =
            matchWinner === "teamA"
              ? updatedWithWinner.challengingTeamId
              : updatedWithWinner.challengedTeamId;
          const losingTeamId =
            matchWinner === "teamA"
              ? updatedWithWinner.challengedTeamId
              : updatedWithWinner.challengingTeamId;

          // Update match status and winner
          await db.collection("scrimmages").updateOne(
            { _id: new ObjectId(params.id) },
            {
              $set: {
                status: "completed",
                winner: matchWinner,
                completedAt: new Date(),
              },
            }
          );

          // Update team stats (increment wins/losses)
          await db
            .collection("teams")
            .updateOne(
              { _id: new ObjectId(winningTeamId) },
              { $inc: { wins: 1 } }
            );

          await db
            .collection("teams")
            .updateOne(
              { _id: new ObjectId(losingTeamId) },
              { $inc: { losses: 1 } }
            );
        }
      }
    }

    // Return the updated scrimmage
    const finalScrimmage = await db.collection("scrimmages").findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json(finalScrimmage);
  } catch (error) {
    console.error("Error submitting scores:", error);
    return NextResponse.json(
      { error: "Failed to submit scores" },
      { status: 500 }
    );
  }
}
