import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, Db } from "mongodb";

// Add interface for Match and Team to make typings clearer
interface Team {
  _id: string;
  name: string;
  tag?: string;
  members?: any[];
  captain?: any;
}

interface Match {
  tournamentMatchId: string;
  teamA: Team;
  teamB: Team;
  mapScores: any[];
  status: string;
  winner?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamIndex, mapIndex, teamAScore, teamBScore } =
      await request.json();
    const matchId = params.matchId;

    if (teamAScore === teamBScore) {
      return NextResponse.json(
        { error: "There must be a winner - scores cannot be equal" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the tournament containing this match
    const tournament = await db.collection("tournaments").findOne({
      "tournamentMatches.tournamentMatchId": matchId,
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Find the match in the tournament
    const matchIndex = tournament.tournamentMatches.findIndex(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (matchIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = tournament.tournamentMatches[matchIndex];

    // Update the match scores
    const updatePath = `tournamentMatches.${matchIndex}.mapScores.${mapIndex}`;
    const winner = teamAScore > teamBScore ? 1 : 2;

    const updateResult = await db.collection("tournaments").updateOne(
      { _id: tournament._id },
      {
        $set: {
          [`${updatePath}.team1Score`]: teamAScore,
          [`${updatePath}.team2Score`]: teamBScore,
          [`${updatePath}.winner`]: winner,
          [`${updatePath}.submittedBy${teamIndex === 0 ? "TeamA" : "TeamB"}`]:
            true,
        },
      }
    );

    // Check if both teams have submitted matching scores
    const updatedTournament = await db.collection("tournaments").findOne({
      _id: tournament._id,
    });

    if (!updatedTournament) {
      return NextResponse.json(
        { error: "Tournament not found after update" },
        { status: 404 }
      );
    }

    const updatedMatch = updatedTournament.tournamentMatches[matchIndex];

    if (!updatedMatch) {
      return NextResponse.json(
        { error: "Match not found after update" },
        { status: 404 }
      );
    }

    const updatedMapScore = updatedMatch.mapScores[mapIndex];

    if (!updatedMapScore) {
      return NextResponse.json(
        { error: "Map score not found after update" },
        { status: 404 }
      );
    }

    // If both teams have submitted matching scores for this map
    if (
      updatedMapScore.submittedByTeamA === true &&
      updatedMapScore.submittedByTeamB === true &&
      updatedMapScore.team1Score === teamAScore &&
      updatedMapScore.team2Score === teamBScore
    ) {
      // Count map wins for each team
      const team1Wins = updatedMatch.mapScores.filter(
        (s: any) => s.winner === 1
      ).length;
      const team2Wins = updatedMatch.mapScores.filter(
        (s: any) => s.winner === 2
      ).length;

      // If a team has won the majority of maps in a best of 3 (or best of X)
      const mapsNeededToWin = Math.ceil(updatedMatch.mapScores.length / 2);
      if (team1Wins >= mapsNeededToWin || team2Wins >= mapsNeededToWin) {
        // Determine match winner
        const matchWinner = team1Wins > team2Wins ? 1 : 2;

        // Update match status to completed
        await db.collection("tournaments").updateOne(
          { _id: tournament._id },
          {
            $set: {
              [`tournamentMatches.${matchIndex}.status`]: "completed",
              [`tournamentMatches.${matchIndex}.winner`]: matchWinner,
            },
          }
        );

        // Now implement the advancement formula
        await advanceWinnerToNextRound(
          db,
          tournament._id,
          match,
          matchWinner === 1 ? match.teamA : match.teamB
        );

        // If this was the final match, update the tournament status and winner
        // Calculate the current round and total rounds from the match ID
        const matchIdParts = match.tournamentMatchId.split("-");
        const roundLabel = matchIdParts[1]; // e.g., "R1"
        const currentRound = parseInt(roundLabel.substring(1));

        // Get the total number of rounds from the tournament structure
        const totalRounds = Math.log2(tournament.brackets.rounds.length * 2);

        const isFinalMatch = currentRound === totalRounds;
        if (isFinalMatch) {
          // Get the winning team
          const winningTeam = matchWinner === 1 ? match.teamA : match.teamB;

          // Update tournament status to completed and set winner
          await db.collection("tournaments").updateOne(
            { _id: tournament._id },
            {
              $set: {
                status: "completed",
                winner: winningTeam,
                completedAt: new Date(),
              },
            }
          );

          console.log(
            `Tournament ${tournament._id} completed! Winner: ${winningTeam.name}`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Score submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}

// Helper function to advance winner to next round with proper type annotations
async function advanceWinnerToNextRound(
  db: Db,
  tournamentId: string | ObjectId,
  match: Match,
  winningTeam: Team
): Promise<boolean> {
  try {
    // Parse the current match identifiers
    const matchIdParts = match.tournamentMatchId.split("-");
    const tournamentIdStr = matchIdParts[0];
    const roundLabel = matchIdParts[1]; // e.g., "R1"
    const matchLabel = matchIdParts[2]; // e.g., "M1"

    // Extract round and match numbers
    const currentRound = parseInt(roundLabel.substring(1));
    const currentMatch = parseInt(matchLabel.substring(1));

    // Calculate next round information
    const nextRound = currentRound + 1;
    const nextMatch = Math.ceil(currentMatch / 2);

    // Determine if winner goes to teamA or teamB position
    const isTeamA = currentMatch % 2 !== 0; // Odd match winners go to teamA position
    const teamPosition = isTeamA ? "teamA" : "teamB";

    // Create the next match ID
    const nextMatchId = `${tournamentIdStr}-R${nextRound}-M${nextMatch}`;

    console.log(
      `Advancing winner of ${match.tournamentMatchId} to ${nextMatchId} as ${teamPosition}`
    );

    // Convert tournamentId to ObjectId if it's a string
    const objectIdTournamentId =
      typeof tournamentId === "string"
        ? new ObjectId(tournamentId)
        : tournamentId;

    // Update the tournament to place the winning team in the next match
    await db.collection("tournaments").updateOne(
      {
        _id: objectIdTournamentId,
        "tournamentMatches.tournamentMatchId": nextMatchId,
      },
      {
        $set: {
          [`tournamentMatches.$.${teamPosition}`]: winningTeam,
        },
      }
    );

    console.log(`Successfully advanced team ${winningTeam.name} to next round`);
    return true;
  } catch (error) {
    console.error("Error advancing winner to next round:", error);
    return false;
  }
}
