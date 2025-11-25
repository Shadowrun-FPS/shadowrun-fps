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

    // Validate scores - ensure they are numbers between 0 and 6
    if (
      typeof teamAScore !== "number" ||
      typeof teamBScore !== "number" ||
      teamAScore < 0 ||
      teamAScore > 6 ||
      teamBScore < 0 ||
      teamBScore > 6
    ) {
      return NextResponse.json(
        { error: "Invalid scores. Scores must be between 0 and 6." },
        { status: 400 }
      );
    }

    // Validate first-to-6, no ties
    if (teamAScore === teamBScore) {
      return NextResponse.json(
        { error: "Scores cannot be equal - one team must win (first to 6)" },
        { status: 400 }
      );
    }

    if (teamAScore !== 6 && teamBScore !== 6) {
      return NextResponse.json(
        { error: "The winning team must have exactly 6 points (first to 6)" },
        { status: 400 }
      );
    }

    if ((teamAScore === 6 && teamBScore >= 6) || (teamBScore === 6 && teamAScore >= 6)) {
      return NextResponse.json(
        { error: "The losing team must have less than 6 points" },
        { status: 400 }
      );
    }

    // NEW: Validate that previous maps have been scored
    // Initialize mapScores array if it doesn't exist
    if (!scrimmage.mapScores) {
      scrimmage.mapScores = [];
    }

    // For maps after the first one, verify previous maps have been scored
    if (mapIndex > 0) {
      // Check if all previous maps have been completely scored
      for (let i = 0; i < mapIndex; i++) {
        // Ensure the previous map exists and is scored by both teams
        if (
          !scrimmage.mapScores[i] ||
          !scrimmage.mapScores[i].teamASubmitted ||
          !scrimmage.mapScores[i].teamBSubmitted
        ) {
          return NextResponse.json(
            { error: "Previous maps must be scored first" },
            { status: 400 }
          );
        }
      }
    }

    // Verify user is authorized to submit scores
    const isAdmin = session.user.roles?.includes("admin");

    // Check if the teams are properly populated
    if (!scrimmage.challengerTeam || !scrimmage.challengedTeam) {
      // If teams aren't populated, fetch them directly
      const { findTeamAcrossCollections } = await import("@/lib/team-collections");
      const challengerTeamResult = await findTeamAcrossCollections(db, scrimmage.challengerTeamId);
      const challengedTeamResult = await findTeamAcrossCollections(db, scrimmage.challengedTeamId);
      
      const challengerTeam = challengerTeamResult?.team;
      const challengedTeam = challengedTeamResult?.team;

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
    // If user is admin, we can't determine which team - but admins shouldn't submit scores per requirements
    // Only team captains should submit
    let submittingTeam: "teamA" | "teamB" | null = null;
    if (isTeamACaptain) {
      submittingTeam = "teamA";
    } else if (isTeamBCaptain) {
      submittingTeam = "teamB";
    } else if (isAdmin) {
      // Admin submitting - we need to determine which team based on context
      // For now, default to teamA if we can't determine (shouldn't happen in practice)
      submittingTeam = "teamA";
    }

    if (!submittingTeam) {
      return NextResponse.json(
        { error: "Unable to determine submitting team" },
        { status: 400 }
      );
    }

    // Ensure the mapScores array has enough elements
    while (scrimmage.mapScores.length <= mapIndex) {
      scrimmage.mapScores.push({
        teamASubmission: null, // { teamAScore, teamBScore }
        teamBSubmission: null, // { teamAScore, teamBScore }
        teamASubmitted: false,
        teamBSubmitted: false,
        teamAScore: null, // Final validated score (only set when both match)
        teamBScore: null, // Final validated score (only set when both match)
        winner: null,
        scoresMatch: false,
      });
    }

    // Update the map score with the submission
    const updatedMapScores = [...scrimmage.mapScores];
    const currentMapScore = updatedMapScores[mapIndex];

    // Store the submission for the submitting team
    if (submittingTeam === "teamA") {
      updatedMapScores[mapIndex] = {
        ...currentMapScore,
        teamASubmission: { teamAScore, teamBScore },
        teamASubmitted: true,
      };
    } else {
      updatedMapScores[mapIndex] = {
        ...currentMapScore,
        teamBSubmission: { teamAScore, teamBScore },
        teamBSubmitted: true,
      };
    }

    // Check if both teams have submitted
    const bothSubmitted = 
      updatedMapScores[mapIndex].teamASubmitted && 
      updatedMapScores[mapIndex].teamBSubmitted;

    if (bothSubmitted) {
      // Get both submissions
      const teamASubmission = updatedMapScores[mapIndex].teamASubmission;
      const teamBSubmission = updatedMapScores[mapIndex].teamBSubmission;

      // Compare scores - they should match
      const scoresMatch = 
        teamASubmission.teamAScore === teamBSubmission.teamAScore &&
        teamASubmission.teamBScore === teamBSubmission.teamBScore;

      if (!scoresMatch) {
        // Scores don't match - reset both submissions
        updatedMapScores[mapIndex] = {
          teamASubmission: null,
          teamBSubmission: null,
          teamASubmitted: false,
          teamBSubmitted: false,
          teamAScore: null,
          teamBScore: null,
          winner: null,
          scoresMatch: false,
        };
      } else {
        // Scores match - validate and set final scores
        const finalTeamAScore = teamASubmission.teamAScore;
        const finalTeamBScore = teamASubmission.teamBScore;

        // Determine map winner (team with 6 rounds)
        let mapWinner = null;
        if (finalTeamAScore === 6 && finalTeamAScore > finalTeamBScore) {
          mapWinner = "teamA";
        } else if (finalTeamBScore === 6 && finalTeamBScore > finalTeamAScore) {
          mapWinner = "teamB";
        }

        updatedMapScores[mapIndex] = {
          ...updatedMapScores[mapIndex],
          teamAScore: finalTeamAScore,
          teamBScore: finalTeamBScore,
          winner: mapWinner,
          scoresMatch: true,
        };
      }
    }

    // Check for match winner - first team to win 2 maps wins the match
    // We check after each map is completed (scores match and winner determined)
    let matchWinner = null;
    const teamAWins = updatedMapScores.filter(
      (map) => map.winner === "teamA" && map.scoresMatch === true
    ).length;
    const teamBWins = updatedMapScores.filter(
      (map) => map.winner === "teamB" && map.scoresMatch === true
    ).length;

    // First to 2 map wins wins the match
    if (teamAWins >= 2) {
      matchWinner = "teamA";
    } else if (teamBWins >= 2) {
      matchWinner = "teamB";
    }

    // Update the scrimmage
    const updateData: any = {
      mapScores: updatedMapScores,
    };

    // If match winner is determined, update match status and winner
    if (matchWinner) {
      const now = new Date();
      updateData.status = "completed";
      updateData.winner = matchWinner;
      updateData.completedAt = now;

      // If the match is completed before the scheduled date, update the scheduledDate
      if (scrimmage.scheduledDate && new Date(scrimmage.scheduledDate) > now) {
        console.log(
          "Match completed before scheduled date. Updating scheduledDate."
        );
        updateData.scheduledDate = now;
      }

      // Update team stats for scrimmage wins/losses
      // Update team wins/losses - need to find which collections the teams are in
      const { findTeamAcrossCollections, getTeamCollectionName } = await import("@/lib/team-collections");
      
      if (matchWinner === "teamA") {
        // Team A won, update their wins and Team B's losses
        const challengerTeamResult = await findTeamAcrossCollections(db, scrimmage.challengerTeamId);
        const challengedTeamResult = await findTeamAcrossCollections(db, scrimmage.challengedTeamId);
        
        if (challengerTeamResult) {
          await db
            .collection(challengerTeamResult.collectionName)
            .updateOne(
              { _id: new ObjectId(scrimmage.challengerTeamId) },
              { $inc: { wins: 1 } }
            );
        }

        if (challengedTeamResult) {
          await db
            .collection(challengedTeamResult.collectionName)
            .updateOne(
              { _id: new ObjectId(scrimmage.challengedTeamId) },
              { $inc: { losses: 1 } }
            );
        }
      } else if (matchWinner === "teamB") {
        // Team B won, update their wins and Team A's losses
        const challengerTeamResult = await findTeamAcrossCollections(db, scrimmage.challengerTeamId);
        const challengedTeamResult = await findTeamAcrossCollections(db, scrimmage.challengedTeamId);
        
        if (challengedTeamResult) {
          await db
            .collection(challengedTeamResult.collectionName)
            .updateOne(
              { _id: new ObjectId(scrimmage.challengedTeamId) },
              { $inc: { wins: 1 } }
            );
        }

        if (challengerTeamResult) {
          await db
            .collection(challengerTeamResult.collectionName)
            .updateOne(
              { _id: new ObjectId(scrimmage.challengerTeamId) },
              { $inc: { losses: 1 } }
            );
        }
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
