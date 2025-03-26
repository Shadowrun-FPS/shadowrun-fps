import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Server } from "socket.io";
import { NextApiResponseServerIO } from "@/types/next";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User session ID:", session.user.id);

    const { db } = await connectToDatabase();

    // Try to find the scrimmage by _id first
    let scrimmage = null;
    try {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(params.id),
      });
    } catch (error) {
      // If ObjectId conversion fails, it's not a valid ObjectId
      console.log("Not a valid ObjectId, trying scrimmageId");
    }

    // If not found by _id, try to find by scrimmageId
    if (!scrimmage) {
      scrimmage = await db.collection("Scrimmages").findOne({
        scrimmageId: params.id,
      });
    }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Log the scrimmage data to debug
    console.log("Scrimmage found:", {
      id: scrimmage._id,
      scrimmageId: scrimmage.scrimmageId,
      challengerTeamCaptain: scrimmage.challengerTeam?.captain?.discordId,
      challengedTeamCaptain: scrimmage.challengedTeam?.captain?.discordId,
    });

    // Get score data
    const data = await request.json();
    const { mapIndex, teamAScore, teamBScore, submittedBy } = data;

    // Verify user is authorized to submit scores
    const isAdmin = session.user.roles?.includes("admin");

    // Check if the teams are properly populated
    if (!scrimmage.challengerTeam || !scrimmage.challengedTeam) {
      // If teams aren't populated, fetch them directly
      const challengerTeam = await db.collection("Teams").findOne({
        _id: new ObjectId(scrimmage.challengerTeamId),
      });

      const challengedTeam = await db.collection("Teams").findOne({
        _id: new ObjectId(scrimmage.challengedTeamId),
      });

      scrimmage.challengerTeam = challengerTeam;
      scrimmage.challengedTeam = challengedTeam;

      console.log("Teams fetched directly:", {
        challengerTeamCaptain: challengerTeam?.captain?.discordId,
        challengedTeamCaptain: challengedTeam?.captain?.discordId,
      });
    }

    const isTeamACaptain =
      session.user.id === scrimmage.challengerTeam?.captain?.discordId ||
      scrimmage.challengerTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );

    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId ||
      scrimmage.challengedTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );

    console.log("Authorization check:", {
      isAdmin,
      isTeamACaptain,
      isTeamBCaptain,
      sessionUserId: session.user.id,
      challengerCaptainId: scrimmage.challengerTeam?.captain?.discordId,
      challengedCaptainId: scrimmage.challengedTeam?.captain?.discordId,
    });

    if (!isAdmin && !isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        {
          error: "You are not authorized to submit scores for this match",
          userId: session.user.id,
          teamACaptainId: scrimmage.challengerTeam?.captain?.discordId,
          teamBCaptainId: scrimmage.challengedTeam?.captain?.discordId,
        },
        { status: 403 }
      );
    }

    // Determine which team is submitting
    const submittingTeam = isTeamACaptain ? "teamA" : "teamB";

    // Determine the winner based on scores
    let winner = null;
    if (teamAScore > teamBScore) {
      winner = "teamA";
    } else if (teamBScore > teamAScore) {
      winner = "teamB";
    } else {
      winner = "tie";
    }

    // Initialize mapScores array if it doesn't exist
    if (!scrimmage.mapScores) {
      scrimmage.mapScores = [];
    }

    // Ensure the mapScores array has enough elements
    while (scrimmage.mapScores.length <= mapIndex) {
      scrimmage.mapScores.push({
        teamAScore: 0,
        teamBScore: 0,
        teamASubmitted: false,
        teamBSubmitted: false,
      });
    }

    // Update the map score
    const updatedMapScores = [...scrimmage.mapScores];
    updatedMapScores[mapIndex] = {
      ...updatedMapScores[mapIndex],
      teamAScore:
        submittingTeam === "teamA"
          ? teamAScore
          : updatedMapScores[mapIndex].teamAScore,
      teamBScore:
        submittingTeam === "teamB"
          ? teamBScore
          : updatedMapScores[mapIndex].teamBScore,
      teamASubmitted:
        submittingTeam === "teamA"
          ? true
          : updatedMapScores[mapIndex].teamASubmitted,
      teamBSubmitted:
        submittingTeam === "teamB"
          ? true
          : updatedMapScores[mapIndex].teamBSubmitted,
    };

    // Update the score matching logic
    if (
      updatedMapScores[mapIndex].teamASubmitted &&
      updatedMapScores[mapIndex].teamBSubmitted
    ) {
      // Get the submitted scores and ensure they're numbers
      const teamASubmittedScore = Number(updatedMapScores[mapIndex].teamAScore);
      const teamBSubmittedScore = Number(updatedMapScores[mapIndex].teamBScore);

      console.log("Final scores for map:", {
        mapIndex,
        teamAScore: teamASubmittedScore,
        teamBScore: teamBSubmittedScore,
      });

      // Determine the winner based on the scores
      if (
        teamASubmittedScore >= 6 &&
        teamASubmittedScore > teamBSubmittedScore
      ) {
        updatedMapScores[mapIndex].winner = "teamA";
      } else if (
        teamBSubmittedScore >= 6 &&
        teamBSubmittedScore > teamASubmittedScore
      ) {
        updatedMapScores[mapIndex].winner = "teamB";
      } else {
        // No winner yet, map not complete
        updatedMapScores[mapIndex].winner = null;
      }
    }

    // Check if all maps have scores submitted by both teams and no disputes
    const allMapsScored = updatedMapScores.every(
      (map) => map.teamASubmitted && map.teamBSubmitted && !map.disputed
    );

    // Determine overall match winner if all maps are scored
    let matchWinner = null;
    if (allMapsScored) {
      const teamAWins = updatedMapScores.filter(
        (map) => map.winner === "teamA"
      ).length;
      const teamBWins = updatedMapScores.filter(
        (map) => map.winner === "teamB"
      ).length;

      // Check if one team has won at least 2 maps
      if (teamAWins >= 2) {
        matchWinner = "teamA";
      } else if (teamBWins >= 2) {
        matchWinner = "teamB";
      } else if (teamAWins + teamBWins === updatedMapScores.length) {
        // All maps played, but no clear winner (should be rare)
        matchWinner = "tie";
      }
    }

    // Update the scrimmage
    const updateData: any = {
      mapScores: updatedMapScores,
    };

    // If match winner is determined, update match status and winner
    if (matchWinner) {
      updateData.status = "completed";
      updateData.winner = matchWinner;
      updateData.completedAt = new Date();

      // Update team stats for scrimmage wins/losses
      if (matchWinner === "teamA") {
        // Team A won, update their wins and Team B's losses
        await db
          .collection("Teams")
          .updateOne(
            { _id: new ObjectId(scrimmage.challengerTeamId) },
            { $inc: { scrimmageWins: 1 } }
          );

        await db
          .collection("Teams")
          .updateOne(
            { _id: new ObjectId(scrimmage.challengedTeamId) },
            { $inc: { scrimmageLosses: 1 } }
          );
      } else if (matchWinner === "teamB") {
        // Team B won, update their wins and Team A's losses
        await db
          .collection("Teams")
          .updateOne(
            { _id: new ObjectId(scrimmage.challengedTeamId) },
            { $inc: { scrimmageWins: 1 } }
          );

        await db
          .collection("Teams")
          .updateOne(
            { _id: new ObjectId(scrimmage.challengerTeamId) },
            { $inc: { scrimmageLosses: 1 } }
          );
      }
      // No need to update stats for ties

      // Create notifications for both teams about the match result
      const teamACaptainId = scrimmage.challengerTeam?.captain?.discordId;
      const teamBCaptainId = scrimmage.challengedTeam?.captain?.discordId;
      const winningTeamName =
        matchWinner === "teamA"
          ? scrimmage.challengerTeam.name
          : matchWinner === "teamB"
          ? scrimmage.challengedTeam.name
          : "No team";

      if (teamACaptainId) {
        await db.collection("Notifications").insertOne({
          userId: teamACaptainId,
          type: "match_completed",
          title: "Match Completed",
          message:
            matchWinner === "tie"
              ? "Your scrimmage has ended in a tie."
              : `Your scrimmage has ended. ${winningTeamName} has won.`,
          scrimmageId: scrimmage.scrimmageId || scrimmage._id.toString(),
          createdAt: new Date(),
          read: false,
        });
      }

      if (teamBCaptainId) {
        await db.collection("Notifications").insertOne({
          userId: teamBCaptainId,
          type: "match_completed",
          title: "Match Completed",
          message:
            matchWinner === "tie"
              ? "Your scrimmage has ended in a tie."
              : `Your scrimmage has ended. ${winningTeamName} has won.`,
          scrimmageId: scrimmage.scrimmageId || scrimmage._id.toString(),
          createdAt: new Date(),
          read: false,
        });
      }
    }

    await db
      .collection("Scrimmages")
      .updateOne({ _id: scrimmage._id }, { $set: updateData });

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: scrimmage._id,
    });

    return NextResponse.json(updatedScrimmage);
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
