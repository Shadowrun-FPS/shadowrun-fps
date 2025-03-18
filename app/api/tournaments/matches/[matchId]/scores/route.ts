import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Get session and verify authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to submit scores" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const matchId = params.matchId;

    // Parse request body
    const { mapIndex, scores } = await request.json();

    if (typeof mapIndex !== "number" || !scores) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Find the tournament with this match
    const tournament = await db.collection("Tournaments").findOne({
      "tournamentMatches.tournamentMatchId": matchId,
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament match not found" },
        { status: 404 }
      );
    }

    // Find the match index within the tournament
    const tournamentMatchIndex = tournament.tournamentMatches.findIndex(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (tournamentMatchIndex === -1) {
      return NextResponse.json(
        { error: "Match not found in tournament" },
        { status: 404 }
      );
    }

    const match = tournament.tournamentMatches[tournamentMatchIndex];

    // Verify user is a member of one of the teams
    const userDiscordId = session.user.id;
    let userTeam = null;

    // Check if user is in team A
    if (match.teamA?.members?.some((m: any) => m.discordId === userDiscordId)) {
      userTeam = 1;
    }
    // Check if user is in team B
    else if (
      match.teamB?.members?.some((m: any) => m.discordId === userDiscordId)
    ) {
      userTeam = 2;
    }

    if (!userTeam) {
      return NextResponse.json(
        { error: "You must be a member of one of the teams to submit scores" },
        { status: 403 }
      );
    }

    // Ensure mapScores array exists
    if (!match.mapScores) {
      match.mapScores = [];
    }

    // Ensure the mapScore for this index exists
    if (!match.mapScores[mapIndex]) {
      match.mapScores[mapIndex] = {
        team1Score: 0,
        team2Score: 0,
      };
    }

    // Update the score
    match.mapScores[mapIndex].team1Score = scores.team1Score;
    match.mapScores[mapIndex].team2Score = scores.team2Score;

    // Mark which team submitted the score
    if (userTeam === 1) {
      match.mapScores[mapIndex].submittedByTeam1 = true;
    } else {
      match.mapScores[mapIndex].submittedByTeam2 = true;
    }

    // Check if both teams have submitted and agree on scores
    if (
      match.mapScores[mapIndex].submittedByTeam1 &&
      match.mapScores[mapIndex].submittedByTeam2
    ) {
      // Determine winner
      if (scores.team1Score > scores.team2Score) {
        match.mapScores[mapIndex].winner = 1;
      } else if (scores.team2Score > scores.team1Score) {
        match.mapScores[mapIndex].winner = 2;
      } else {
        match.mapScores[mapIndex].winner = "draw";
      }

      // Check if match is completed (all maps have a winner)
      const allMapsCompleted =
        match.maps?.length === match.mapScores.length &&
        match.mapScores.every((ms: any) => ms.winner);

      if (allMapsCompleted) {
        // Count wins for each team
        const team1Wins = match.mapScores.filter(
          (ms: any) => ms.winner === 1
        ).length;
        const team2Wins = match.mapScores.filter(
          (ms: any) => ms.winner === 2
        ).length;

        match.status = "completed";
        match.winner = team1Wins > team2Wins ? 1 : 2;

        // Update the bracket match with the results
        const roundIndex = match.roundIndex;
        const matchIndex = match.matchIndex;

        // Update the match in the bracket
        tournament.brackets.rounds[roundIndex].matches[matchIndex].scores = {
          teamA: team1Wins,
          teamB: team2Wins,
        };

        tournament.brackets.rounds[roundIndex].matches[matchIndex].winner =
          team1Wins > team2Wins ? "teamA" : "teamB";

        tournament.brackets.rounds[roundIndex].matches[matchIndex].status =
          "completed";

        // If there's a next round, update the teams there
        if (roundIndex + 1 < tournament.brackets.rounds.length) {
          const nextRoundIndex = roundIndex + 1;
          const nextMatchIndex = Math.floor(matchIndex / 2);

          const winningTeam = team1Wins > team2Wins ? match.teamA : match.teamB;
          const nextMatch =
            tournament.brackets.rounds[nextRoundIndex].matches[nextMatchIndex];

          // If we're coming from an even-indexed match, we're teamA in the next match
          if (matchIndex % 2 === 0) {
            nextMatch.teamA = winningTeam;
          } else {
            nextMatch.teamB = winningTeam;
          }

          // Create a new match in the tournamentMatches array for the next round
          if (nextMatch.teamA && nextMatch.teamB) {
            const nextTournamentMatchId = `${tournament._id.toString()}-R${
              nextRoundIndex + 1
            }-M${nextMatchIndex + 1}`;

            // Check if this match already exists
            const matchExists = tournament.tournamentMatches.some(
              (m: any) => m.tournamentMatchId === nextTournamentMatchId
            );

            if (!matchExists) {
              tournament.tournamentMatches.push({
                tournamentMatchId: nextTournamentMatchId,
                tournamentId: tournament._id.toString(),
                roundIndex: nextRoundIndex,
                matchIndex: nextMatchIndex,
                teamA: nextMatch.teamA,
                teamB: nextMatch.teamB,
                status: "upcoming",
                createdAt: new Date(),
                maps: match.maps, // Use the same map pool
              });

              // Update the match in the bracket with the match ID
              nextMatch.tournamentMatchId = nextTournamentMatchId;
            }
          }
        }
      }
    }

    // Update the tournament
    await db.collection("Tournaments").updateOne(
      { _id: tournament._id },
      {
        $set: {
          tournamentMatches: tournament.tournamentMatches,
          "brackets.rounds": tournament.brackets.rounds,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Score submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting tournament match score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
