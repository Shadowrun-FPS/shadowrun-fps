import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { emitMatchUpdate } from "@/lib/socket";

export const dynamic = "force-dynamic";

interface ScoreSubmission {
  mapIndex: number;
  team1Score: number;
  team2Score: number;
  submittingTeam: number;
}

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  discordProfilePicture?: string;
  elo: number;
  joinedAt: number;
}

// Add validation helper
function validateRoundScores(
  team1Score: number,
  team2Score: number
): string | null {
  if (team1Score < 0 || team2Score < 0) {
    return "Scores cannot be negative";
  }

  if (team1Score > 6 || team2Score > 6) {
    return "Scores cannot exceed 6 rounds";
  }

  if (team1Score === team2Score) {
    return "Scores cannot be tied";
  }

  // At least one team must have 6 rounds
  if (team1Score !== 6 && team2Score !== 6) {
    return "One team must win 6 rounds";
  }

  return null;
}

async function reinsertWinnersIntoQueue(
  db: any,
  match: any,
  winningTeam: number
): Promise<void> {
  try {
    // Get the winning team's players
    const winningPlayers = winningTeam === 1 ? match.team1 : match.team2;

    // Find the original queue that this match was created from
    const queue = await db.collection("Queues").findOne({
      teamSize: match.teamSize,
      eloTier: match.eloTier,
    });

    if (!queue) {
      console.error("Original queue not found for winners stay");
      return;
    }

    // Convert winning players to queue player format
    const winnersToReinsert: QueuePlayer[] = winningPlayers.map(
      (player: any) => ({
        discordId: player.discordId,
        discordUsername: player.discordUsername,
        discordNickname: player.discordNickname,
        discordProfilePicture: player.discordProfilePicture,
        elo: player.elo,
        joinedAt: Date.now(), // Current timestamp for new join
      })
    );

    // Get current players in queue
    const currentPlayers = queue.players || [];

    // Create new players array with winners at the start
    const updatedPlayers = [...winnersToReinsert, ...currentPlayers];

    // Update the queue
    await db
      .collection("Queues")
      .updateOne({ _id: queue._id }, { $set: { players: updatedPlayers } });

    // Fetch all queues to broadcast update
    const updatedQueues = await db.collection("Queues").find({}).toArray();
    if (global.io) {
      global.io.emit("queues:update", updatedQueues);
    }
  } catch (error) {
    console.error("Error reinserting winners into queue:", error);
  }
}

// Helper function to determine map winner
function determineMapWinner(team1Score: number, team2Score: number) {
  return {
    winner: team1Score === 6 ? 1 : team2Score === 6 ? 2 : undefined,
    winningScore: team1Score === 6 ? team1Score : team2Score,
    losingScore: team1Score === 6 ? team2Score : team1Score,
  };
}

// Helper function to check if scores match
function doScoresMatch(mapScore: any): boolean {
  const team1Submission = {
    team1Score: mapScore.team1SubmittedByTeam1Score,
    team2Score: mapScore.team2SubmittedByTeam1Score,
  };
  const team2Submission = {
    team1Score: mapScore.team1SubmittedByTeam2Score,
    team2Score: mapScore.team2SubmittedByTeam2Score,
  };

  return (
    team1Submission.team1Score === team2Submission.team1Score &&
    team1Submission.team2Score === team2Submission.team2Score
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = (await req.json()) as ScoreSubmission;
    const { mapIndex, team1Score, team2Score, submittingTeam } = data;

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Find the match
    const match = await db.collection("Matches").findOne({
      matchId: params.matchId,
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Create or update the mapScores array
    const mapScores = match.mapScores || [];
    mapScores[mapIndex] = {
      ...(mapScores[mapIndex] || {}),
      // Store each team's submission separately with clear naming
      ...(submittingTeam === 1
        ? {
            team1SubmittedByTeam1Score: team1Score,
            team2SubmittedByTeam1Score: team2Score,
          }
        : {
            team1SubmittedByTeam2Score: team1Score,
            team2SubmittedByTeam2Score: team2Score,
          }),
      submittedByTeam1:
        submittingTeam === 1 ? true : mapScores[mapIndex]?.submittedByTeam1,
      submittedByTeam2:
        submittingTeam === 2 ? true : mapScores[mapIndex]?.submittedByTeam2,
      [`submittedByTeam${submittingTeam}User`]: {
        discordId: session.user.id,
        discordUsername: session.user.name,
        discordNickname: session.user.name || session.user.name,
      },
    };

    // If both teams have submitted scores for this map, check if they match
    if (
      mapScores[mapIndex].submittedByTeam1 &&
      mapScores[mapIndex].submittedByTeam2
    ) {
      if (doScoresMatch(mapScores[mapIndex])) {
        // Scores match - validate and set official scores
        const scoreError = validateRoundScores(
          mapScores[mapIndex].team1SubmittedByTeam1Score,
          mapScores[mapIndex].team2SubmittedByTeam1Score
        );
        if (!scoreError) {
          mapScores[mapIndex] = {
            ...mapScores[mapIndex],
            team1Score: mapScores[mapIndex].team1SubmittedByTeam1Score,
            team2Score: mapScores[mapIndex].team2SubmittedByTeam1Score,
            ...determineMapWinner(
              mapScores[mapIndex].team1SubmittedByTeam1Score,
              mapScores[mapIndex].team2SubmittedByTeam1Score
            ),
            scoresVerified: true,
          };
        }
      } else {
        // Scores don't match - reset submissions and require resubmission
        mapScores[mapIndex] = {
          submittedByTeam1: false,
          submittedByTeam2: false,
          scoresVerified: false,
          scoresMismatch: true, // Add flag to show there was a mismatch
          team1SubmittedByTeam1Score: null,
          team2SubmittedByTeam1Score: null,
          team1SubmittedByTeam2Score: null,
          team2SubmittedByTeam2Score: null,
        };
      }
    }

    // Only count verified scores for match completion
    const completedMaps = mapScores.filter(
      (score: any) => score?.scoresVerified === true
    );

    const team1Wins = completedMaps.filter(
      (score: any) => score?.winner === 1
    ).length;
    const team2Wins = completedMaps.filter(
      (score: any) => score?.winner === 2
    ).length;

    // Update match with scores and winner if applicable
    const result = await db.collection("Matches").updateOne(
      { matchId: params.matchId },
      {
        $set: {
          mapScores,
          lastUpdatedAt: new Date(),
          // Set match as completed if a team has won 2 maps
          ...(team1Wins === 2 || team2Wins === 2
            ? {
                status: "completed",
                winner: team1Wins === 2 ? 1 : 2,
                completedAt: new Date(),
                team1MapWins: team1Wins,
                team2MapWins: team2Wins,
              }
            : {}),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update match score" },
        { status: 400 }
      );
    }

    // If match is completed, handle Winners Stay
    if (team1Wins === 2 || team2Wins === 2) {
      const winningTeam = team1Wins === 2 ? 1 : 2;
      await reinsertWinnersIntoQueue(db, match, winningTeam);
    }

    // Get updated match data
    const updatedMatch = await db.collection("Matches").findOne({
      matchId: params.matchId,
    });

    // Emit match update event with specific status
    if (updatedMatch) {
      const eventData = {
        ...updatedMatch,
        updateType: mapScores[mapIndex].scoresMismatch
          ? "scoreMismatch"
          : mapScores[mapIndex].scoresVerified
          ? "scoresVerified"
          : "scoreSubmitted",
        mapIndex,
        timestamp: Date.now(),
      };

      emitMatchUpdate(eventData);
      console.log("Emitted match update:", eventData);
    }

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
