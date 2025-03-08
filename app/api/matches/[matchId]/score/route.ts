import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to submit scores" },
        { status: 401 }
      );
    }

    const { mapIndex, team1Score, team2Score, submittingTeam } =
      await req.json();

    // Validate inputs
    if (
      typeof mapIndex !== "number" ||
      typeof team1Score !== "number" ||
      typeof team2Score !== "number" ||
      (submittingTeam !== 1 && submittingTeam !== 2)
    ) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    // Validate score values
    if (
      team1Score < 0 ||
      team1Score > 6 ||
      team2Score < 0 ||
      team2Score > 6 ||
      team1Score === team2Score
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid scores. Scores must be between 0-6 and cannot be tied.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get the match
    const match = await db.collection("Matches").findOne({
      matchId: params.matchId,
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is part of the match
    const isInTeam1 = match.team1.some(
      (p: any) => p.discordId === session.user.id
    );
    const isInTeam2 = match.team2.some(
      (p: any) => p.discordId === session.user.id
    );

    if (!isInTeam1 && !isInTeam2) {
      return NextResponse.json(
        { error: "You are not part of this match" },
        { status: 403 }
      );
    }

    // Verify user is in the team they claim to be submitting for
    if (
      (submittingTeam === 1 && !isInTeam1) ||
      (submittingTeam === 2 && !isInTeam2)
    ) {
      return NextResponse.json(
        { error: "You can only submit scores for your own team" },
        { status: 403 }
      );
    }

    // Check if match is in progress
    if (match.status !== "in_progress" && match.status !== "draft") {
      return NextResponse.json(
        { error: "This match is not in progress" },
        { status: 400 }
      );
    }

    // Initialize mapScores array if it doesn't exist
    if (!match.mapScores) {
      await db
        .collection("Matches")
        .updateOne({ matchId: params.matchId }, { $set: { mapScores: [] } });
    }

    // Get current map scores
    const mapScores = match.mapScores || [];

    // Ensure the map index exists
    if (mapIndex >= match.maps.length) {
      return NextResponse.json({ error: "Invalid map index" }, { status: 400 });
    }

    // Check if this map already has a winner
    if (mapScores[mapIndex]?.winner) {
      return NextResponse.json(
        { error: "This map has already been scored" },
        { status: 400 }
      );
    }

    // Update or create the map score
    const currentMapScore = mapScores[mapIndex] || {
      team1Score: 0,
      team2Score: 0,
      submittedByTeam1: false,
      submittedByTeam2: false,
    };

    // Update the scores and submission status
    const updatedMapScore = {
      ...currentMapScore,
      team1Score:
        submittingTeam === 1 ? team1Score : currentMapScore.team1Score,
      team2Score:
        submittingTeam === 1 ? team2Score : currentMapScore.team2Score,
      submittedByTeam1:
        submittingTeam === 1 ? true : currentMapScore.submittedByTeam1,
      submittedByTeam2:
        submittingTeam === 2 ? true : currentMapScore.submittedByTeam2,
    };

    // Check if both teams have submitted scores
    if (updatedMapScore.submittedByTeam1 && updatedMapScore.submittedByTeam2) {
      // Check if scores match
      if (
        (submittingTeam === 1 &&
          (team1Score !== currentMapScore.team1Score ||
            team2Score !== currentMapScore.team2Score)) ||
        (submittingTeam === 2 &&
          (team1Score !== currentMapScore.team1Score ||
            team2Score !== currentMapScore.team2Score))
      ) {
        // Scores don't match, reset both submissions
        updatedMapScore.submittedByTeam1 = false;
        updatedMapScore.submittedByTeam2 = false;

        // Update the map score
        const newMapScores = [...mapScores];
        newMapScores[mapIndex] = updatedMapScore;

        await db
          .collection("Matches")
          .updateOne(
            { matchId: params.matchId },
            { $set: { mapScores: newMapScores } }
          );

        return NextResponse.json(
          {
            error: "Score mismatch. Both teams need to submit matching scores.",
            reset: true,
          },
          { status: 409 }
        );
      }

      // Scores match, determine the winner
      const winner = team1Score > team2Score ? 1 : 2;
      updatedMapScore.winner = winner;

      // Update the map score
      const newMapScores = [...mapScores];
      newMapScores[mapIndex] = updatedMapScore;

      // Count wins for each team
      const team1Wins = newMapScores.filter(
        (score) => score?.winner === 1
      ).length;
      const team2Wins = newMapScores.filter(
        (score) => score?.winner === 2
      ).length;

      // Check if match is complete (one team has 2 wins)
      let matchCompleted = false;
      let matchWinner = null;

      if (team1Wins >= 2) {
        matchCompleted = true;
        matchWinner = 1;
      } else if (team2Wins >= 2) {
        matchCompleted = true;
        matchWinner = 2;
      }

      // Update match status if completed
      if (matchCompleted) {
        await db.collection("Matches").updateOne(
          { matchId: params.matchId },
          {
            $set: {
              mapScores: newMapScores,
              status: "completed",
              winner: matchWinner,
              completedAt: Date.now(),
            },
          }
        );

        // If match is completed, add winning team back to the queue
        if (matchWinner) {
          const winningTeam = matchWinner === 1 ? match.team1 : match.team2;
          const queueId = match.queueId; // Assuming you store the original queue ID

          if (queueId) {
            // Get the queue
            const queue = await db.collection("Queues").findOne({
              _id: queueId,
            });

            if (queue) {
              // Add winning team players to the front of the queue
              const winningPlayerIds = winningTeam.map((p: any) => p.discordId);

              // Filter out any players already in the queue
              const playersToAdd = winningTeam.filter(
                (p: any) =>
                  !queue.players.some((qp: any) => qp.discordId === p.discordId)
              );

              if (playersToAdd.length > 0) {
                // Add timestamp to players
                const playersWithTimestamp = playersToAdd.map((p: any) => ({
                  ...p,
                  joinedAt: Date.now(),
                }));

                // Add players to the front of the queue
                await db.collection("Queues").updateOne(
                  { _id: queueId },
                  {
                    $push: {
                      players: {
                        $each: playersWithTimestamp,
                        $position: 0,
                      } as any,
                    },
                  }
                );

                // Emit queue update event
                const updatedQueues = await db
                  .collection("Queues")
                  .find({})
                  .toArray();
                if (global.io) {
                  global.io.emit("queues:update", updatedQueues);
                }
              }
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: "Score submitted and match completed",
          matchCompleted: true,
          winner: matchWinner,
        });
      } else {
        // Match not completed yet
        await db
          .collection("Matches")
          .updateOne(
            { matchId: params.matchId },
            { $set: { mapScores: newMapScores, status: "in_progress" } }
          );

        return NextResponse.json({
          success: true,
          message: "Score submitted and verified",
          mapWinner: winner,
        });
      }
    } else {
      // Only one team has submitted so far
      const newMapScores = [...mapScores];
      newMapScores[mapIndex] = updatedMapScore;

      await db
        .collection("Matches")
        .updateOne(
          { matchId: params.matchId },
          { $set: { mapScores: newMapScores, status: "in_progress" } }
        );

      return NextResponse.json({
        success: true,
        message: "Score submitted. Waiting for the other team to verify.",
      });
    }
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
