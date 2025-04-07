import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = params;
    const { mapIndex, team1Score, team2Score, submittedByTeam } =
      await request.json();

    // Validate input
    if (
      typeof mapIndex !== "number" ||
      typeof team1Score !== "number" ||
      typeof team2Score !== "number" ||
      !["teamA", "teamB"].includes(submittedByTeam)
    ) {
      return NextResponse.json(
        { error: "Invalid score submission data" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the tournament and match
    const tournament = await db.collection("Tournaments").findOne(
      { "tournamentMatches.tournamentMatchId": matchId },
      {
        projection: {
          tournamentMatches: 1,
          name: 1,
          _id: 1,
          brackets: 1,
          maps: 1,
          teams: 1,
        },
      }
    );

    if (!tournament) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Find the match
    const match = tournament.tournamentMatches.find(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify the user is on one of the teams
    const userTeamId =
      submittedByTeam === "teamA" ? match.teamA.teamId : match.teamB.teamId;
    const team = tournament.teams.find(
      (t: any) => t._id.toString() === userTeamId.toString()
    );

    if (!team || !team.members.some((m: any) => m.userId === session.user.id)) {
      return NextResponse.json(
        { error: "You are not authorized to submit scores for this team" },
        { status: 403 }
      );
    }

    // Update map scores
    let mapScores = [...(match.mapScores || [])];

    // Initialize the map scores array if it doesn't exist or doesn't have this map yet
    while (mapScores.length <= mapIndex) {
      mapScores.push({
        team1Score: 0,
        team2Score: 0,
        submittedByTeamA: false,
        submittedByTeamB: false,
      });
    }

    // Update the score for this map
    mapScores[mapIndex] = {
      ...mapScores[mapIndex],
      team1Score,
      team2Score,
      [`submittedBy${submittedByTeam === "teamA" ? "TeamA" : "TeamB"}`]: true,
      winner: team1Score > team2Score ? 1 : team2Score > team1Score ? 2 : null,
    };

    // Check if both teams have submitted for this map
    const bothTeamsSubmitted =
      mapScores[mapIndex].submittedByTeamA &&
      mapScores[mapIndex].submittedByTeamB;

    // If both teams submitted identical scores, accept them as confirmed
    const scoresMatch =
      mapScores[mapIndex].team1Score === mapScores[mapIndex].team2Score;

    const scoreConfirmed = bothTeamsSubmitted || scoresMatch;

    // Update the match with the new map scores
    await db
      .collection("Tournaments")
      .updateOne(
        { _id: tournament._id, "tournamentMatches.tournamentMatchId": matchId },
        { $set: { "tournamentMatches.$.mapScores": mapScores } }
      );

    // Check if match is complete (2 winning maps for a team)
    let matchComplete = false;
    let matchWinner = null;

    if (scoreConfirmed) {
      // Count winning maps for each team
      const team1Wins = mapScores.filter((score) => score.winner === 1).length;
      const team2Wins = mapScores.filter((score) => score.winner === 2).length;

      // In a best-of-3, first to 2 wins
      if (team1Wins >= 2) {
        matchComplete = true;
        matchWinner = 1;
      } else if (team2Wins >= 2) {
        matchComplete = true;
        matchWinner = 2;
      }
    }

    // If match is complete, update match status and proceed with tournament advancement
    if (matchComplete && matchWinner) {
      // Update match status to completed and set winner
      await db.collection("Tournaments").updateOne(
        { _id: tournament._id, "tournamentMatches.tournamentMatchId": matchId },
        {
          $set: {
            "tournamentMatches.$.status": "completed",
            "tournamentMatches.$.winner": matchWinner,
          },
        }
      );

      // Parse the round and match number from the matchId
      const matchIdParts = matchId.split("-");
      const tournamentId = matchIdParts[0];
      // Extract round and match numbers from format like "T123-R1-M1"
      const roundStr = matchIdParts
        .find((p) => p.startsWith("R"))
        ?.substring(1);
      const matchStr = matchIdParts
        .find((p) => p.startsWith("M"))
        ?.substring(1);

      if (roundStr && matchStr) {
        const roundNum = parseInt(roundStr);
        const matchNum = parseInt(matchStr);

        // Calculate the next round and match
        const nextRound = roundNum + 1;
        const nextMatchNum = Math.ceil(matchNum / 2);

        // Determine if the winner goes to position A or B in the next match
        // If current match is odd-numbered, winner goes to A, otherwise to B
        const isTeamA = matchNum % 2 !== 0;

        // Construct the next match ID
        const nextMatchId = `${tournamentId}-R${nextRound}-M${nextMatchNum}`;

        // Get the winning team details
        const winningTeamObj = matchWinner === 1 ? match.teamA : match.teamB;

        if (winningTeamObj) {
          // Update fields based on whether winning team is going to position A or B
          const updateField = isTeamA
            ? "tournamentMatches.$.teamA"
            : "tournamentMatches.$.teamB";

          // Check if the next match already exists
          const nextMatchExists = tournament.tournamentMatches.some(
            (m: any) => m.tournamentMatchId === nextMatchId
          );

          if (nextMatchExists) {
            // Just update the team in the existing match
            await db.collection("Tournaments").updateOne(
              {
                _id: tournament._id,
                "tournamentMatches.tournamentMatchId": nextMatchId,
              },
              {
                $set: {
                  [updateField]: winningTeamObj,
                },
              }
            );
          }
        }

        // Update bracket UI
        if (tournament.brackets && tournament.brackets.rounds) {
          // Find the right round in the brackets structure (0-based index, so round 1 is at index 0)
          const roundIndex = roundNum - 1;
          if (tournament.brackets.rounds[roundIndex]) {
            // The matches in the brackets structure are stored in an array
            // Find the right match (matchNum is 1-based, array is 0-based)
            const matchArrayIndex = matchNum - 1;

            if (
              tournament.brackets.rounds[roundIndex].matches[matchArrayIndex]
            ) {
              // Update the scores and status in the bracket
              const bracketUpdate = {
                [`brackets.rounds.${roundIndex}.matches.${matchArrayIndex}.scores.teamA`]:
                  matchWinner === 1 ? 2 : 0,
                [`brackets.rounds.${roundIndex}.matches.${matchArrayIndex}.scores.teamB`]:
                  matchWinner === 2 ? 2 : 0,
                [`brackets.rounds.${roundIndex}.matches.${matchArrayIndex}.status`]:
                  "completed",
                [`brackets.rounds.${roundIndex}.matches.${matchArrayIndex}.winner`]:
                  matchWinner === 1 ? "teamA" : "teamB",
              };

              await db
                .collection("Tournaments")
                .updateOne({ _id: tournament._id }, { $set: bracketUpdate });

              // If there's a next round, also update the team in the next match in the bracket
              if (tournament.brackets.rounds[roundIndex + 1]) {
                const nextMatchArrayIndex = Math.floor(matchArrayIndex / 2);
                const nextTeamField =
                  matchArrayIndex % 2 === 0 ? "teamA" : "teamB";

                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $set: {
                      [`brackets.rounds.${
                        roundIndex + 1
                      }.matches.${nextMatchArrayIndex}.${nextTeamField}`]: {
                        _id: winningTeamObj.teamId,
                        name: winningTeamObj.name,
                        tag: winningTeamObj.tag,
                        seed:
                          winningTeamObj.seed || (matchWinner === 1 ? 1 : 2),
                      },
                    },
                  }
                );
              }
            }
          }
        }

        // Check if all matches in the current round are completed
        // Get the updated tournament data first
        const updatedTournament = await db.collection("Tournaments").findOne(
          { _id: tournament._id },
          {
            projection: {
              tournamentMatches: 1,
              brackets: 1,
              maps: 1,
              teams: 1,
            },
          }
        );

        // Add null check for updatedTournament
        if (updatedTournament) {
          // Find all matches in the current round
          const currentRoundMatches =
            updatedTournament.tournamentMatches.filter((m: any) =>
              m.tournamentMatchId.includes(`-R${roundNum}-`)
            );

          // Check if all matches in the round are completed
          const allMatchesCompleted = currentRoundMatches.every(
            (m: any) => m.status === "completed"
          );

          if (allMatchesCompleted) {
            console.log(
              `All matches in Round ${roundNum} are completed. Creating next round matches.`
            );

            // Get all matches in the next round from the bracket
            const nextRoundBracketMatches =
              updatedTournament.brackets?.rounds[roundNum]?.matches || [];

            // Helper function to randomly select 3 maps
            const selectRandomMaps = (allMaps: any[]) => {
              // Shuffle maps and take first 3
              const shuffled = [...allMaps].sort(() => 0.5 - Math.random());
              return shuffled.slice(0, 3).map((map) => ({
                mapName: map.name,
                mapImage:
                  map.image ||
                  `/maps/map_${map.name.toLowerCase().replace(/\s+/g, "")}.png`,
              }));
            };

            // For each match in the next round
            for (let i = 0; i < nextRoundBracketMatches.length; i++) {
              const bracketMatch = nextRoundBracketMatches[i];
              const nextMatchId = `${tournamentId}-R${nextRound}-M${i + 1}`;

              // Check if both teams are assigned (this means both previous matches have winners)
              if (bracketMatch.teamA && bracketMatch.teamB) {
                // Check if the match already exists in tournamentMatches
                const matchExists = updatedTournament.tournamentMatches.some(
                  (m: any) => m.tournamentMatchId === nextMatchId
                );

                if (!matchExists) {
                  // Find full team data from tournament.teams
                  const teamA = updatedTournament.teams.find(
                    (t: any) =>
                      t._id.toString() === bracketMatch.teamA._id.toString()
                  );

                  const teamB = updatedTournament.teams.find(
                    (t: any) =>
                      t._id.toString() === bracketMatch.teamB._id.toString()
                  );

                  if (!teamA || !teamB) {
                    console.error(
                      `Could not find full team data for match ${nextMatchId}`
                    );
                    continue;
                  }

                  // Select random maps for this match from tournament maps
                  const matchMaps = selectRandomMaps(
                    updatedTournament.maps || []
                  );

                  // Create new match with the full team data
                  const newMatch = {
                    tournamentMatchId: nextMatchId,
                    teamA: teamA,
                    teamB: teamB,
                    status: "live",
                    maps: matchMaps,
                    mapScores: [],
                    winner: null,
                    round: nextRound,
                    matchNumber: i + 1,
                    createdAt: new Date(),
                    startTime: new Date(),
                  };

                  // Add the new match to tournamentMatches
                  await db
                    .collection("Tournaments")
                    .updateOne(
                      { _id: tournament._id },
                      { $push: { tournamentMatches: newMatch } as any }
                    );

                  // Update the bracket status to live
                  await db.collection("Tournaments").updateOne(
                    { _id: tournament._id },
                    {
                      $set: {
                        [`brackets.rounds.${roundNum}.matches.${i}.status`]:
                          "live",
                        [`brackets.rounds.${roundNum}.matches.${i}.tournamentMatchId`]:
                          nextMatchId,
                      },
                    }
                  );
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      mapScores,
      matchComplete,
      matchWinner: matchWinner
        ? matchWinner === 1
          ? match.teamA.name
          : match.teamB.name
        : null,
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
