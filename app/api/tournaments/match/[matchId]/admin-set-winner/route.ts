import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Validate admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (
      !session.user.isAdmin &&
      session.user.id !== SECURITY_CONFIG.DEVELOPER_ID
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { matchId } = params;
    const { winningTeam } = await request.json();

    if (typeof winningTeam !== "number" || ![1, 2].includes(winningTeam)) {
      return NextResponse.json(
        { error: "Invalid winner. Must be 1 (Team A) or 2 (Team B)" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the tournament containing this match
    const tournament = await db.collection("Tournaments").findOne(
      { "tournamentMatches.tournamentMatchId": matchId },
      {
        projection: {
          tournamentMatches: 1,
          brackets: 1,
          _id: 1,
          registeredTeams: 1,
          maps: 1,
        },
      }
    );

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament match not found" },
        { status: 404 }
      );
    }

    // Find the match in the tournament
    const matchIndex = tournament.tournamentMatches.findIndex(
      (m: any) => m.tournamentMatchId === matchId
    );

    if (matchIndex === -1) {
      return NextResponse.json(
        { error: "Match not found in tournament" },
        { status: 404 }
      );
    }

    const match = tournament.tournamentMatches[matchIndex];

    // Update the match with the winner
    const winner = winningTeam === 1 ? "teamA" : "teamB";
    const winningTeamData = winningTeam === 1 ? match.teamA : match.teamB;

    await db.collection("Tournaments").updateOne(
      { "tournamentMatches.tournamentMatchId": matchId },
      {
        $set: {
          [`tournamentMatches.${matchIndex}.winner`]: winner,
          [`tournamentMatches.${matchIndex}.status`]: "completed",
          [`tournamentMatches.${matchIndex}.completedAt`]: new Date(),
        },
      }
    );

    // Find and update the match in the brackets
    let bracketUpdated = false;
    let roundNum = 0;
    let matchNum = 0;

    // Find the match in brackets
    if (tournament.brackets && tournament.brackets.rounds) {
      for (let i = 0; i < tournament.brackets.rounds.length; i++) {
        const round = tournament.brackets.rounds[i];
        if (round.matches) {
          for (let j = 0; j < round.matches.length; j++) {
            if (round.matches[j].tournamentMatchId === matchId) {
              roundNum = i;
              matchNum = j;
              bracketUpdated = true;

              // Update the bracket with winner info
              await db.collection("Tournaments").updateOne(
                { _id: tournament._id },
                {
                  $set: {
                    [`brackets.rounds.${i}.matches.${j}.winner`]: winner,
                    [`brackets.rounds.${i}.matches.${j}.status`]: "completed",
                  },
                }
              );
              break;
            }
          }
          if (bracketUpdated) break;
        }
      }
    }

    // Define nextRound here, outside of conditionals to ensure it's available
    const nextRound = roundNum + 1;

    // Advanced tournament logic: Update next round's match with the winner
    if (bracketUpdated) {
      // Make sure we're using the correct tournament ID
      const tournamentIdForMatches = tournament._id.toString();

      // Get the updated tournament to ensure we have the latest bracket state
      const updatedTournament = await db
        .collection("Tournaments")
        .findOne({ _id: tournament._id });

      if (
        updatedTournament &&
        updatedTournament.brackets?.rounds?.[nextRound]
      ) {
        // Calculate which match in the next round should have this winner
        const nextMatchIndex = Math.floor(matchNum / 2);
        const isFirstTeam = matchNum % 2 === 0;

        // Find the full team object from registeredTeams
        const fullTeamData = updatedTournament.registeredTeams.find(
          (t: any) => t._id.toString() === winningTeamData._id.toString()
        );

        if (!fullTeamData) {
          console.error("Could not find full team data for advancing team");
          return NextResponse.json(
            { error: "Team data not found" },
            { status: 500 }
          );
        }

        // Update next round's match with this winner (using full team data)
        const updateField = isFirstTeam ? "teamA" : "teamB";

        await db.collection("Tournaments").updateOne(
          { _id: tournament._id },
          {
            $set: {
              [`brackets.rounds.${nextRound}.matches.${nextMatchIndex}.${updateField}`]:
                fullTeamData,
            },
          }
        );

        // Check if all matches in the current round are completed
        const allMatchesCompleted = updatedTournament.brackets.rounds[
          roundNum
        ].matches.every((m: any) => m.status === "completed");

        // If all matches in this round are completed, create matches for the next round
        if (allMatchesCompleted) {
          console.log(
            `All matches in Round ${roundNum} are completed. Creating next round matches.`
          );

          // Get all matches in the next round from the bracket
          const nextRoundBracketMatches =
            updatedTournament.brackets?.rounds[nextRound]?.matches || [];

          // Get all ranked maps from the Maps collection
          const rankedMaps = await db
            .collection("Maps")
            .find({ rankedMap: true })
            .toArray();

          // Prepare maps array with both regular and small variants
          const allMapsWithVariants: any[] = [];

          rankedMaps.forEach((map: any) => {
            // Add the regular map
            allMapsWithVariants.push({
              _id: map._id,
              name: map.name,
              gameMode: map.gameMode,
              src: map.src,
              isSmall: false,
            });

            // If smallOption is true, add a small variant
            if (map.smallOption) {
              allMapsWithVariants.push({
                _id: map._id,
                name: `${map.name} (Small)`,
                gameMode: map.gameMode,
                src: map.src,
                isSmall: true,
              });
            }
          });

          // Fetch the MOST RECENT tournament data to ensure we have latest bracket state
          const latestTournament = await db
            .collection("Tournaments")
            .findOne({ _id: tournament._id });

          if (!latestTournament) {
            console.error("Could not find latest tournament data");
            return NextResponse.json(
              { error: "Tournament data not found" },
              { status: 500 }
            );
          }

          // Process each next round match
          for (let i = 0; i < nextRoundBracketMatches.length; i++) {
            // Use the latest tournament data for bracket matches
            const bracketMatch =
              latestTournament.brackets.rounds[nextRound].matches[i];

            // Use the correct tournament ID and match number
            const nextMatchId = `${tournamentIdForMatches}-R${nextRound + 1}-M${
              i + 1
            }`;

            // Generate random maps for this match
            const shuffled = [...allMapsWithVariants].sort(
              () => 0.5 - Math.random()
            );
            const randomMaps = shuffled
              .slice(0, Math.min(3, shuffled.length))
              .map((map) => ({
                mapName: map.name,
                mapImage: map.src,
                gameMode: map.gameMode,
                isSmall: map.isSmall,
              }));

            // Check if both teams are assigned (both previous matches have winners)
            // But create the match regardless with available team data
            const teamA = bracketMatch.teamA || null;
            const teamB = bracketMatch.teamB || null;

            // Create new match object
            const newMatch = {
              tournamentMatchId: nextMatchId,
              teamA: teamA,
              teamB: teamB,
              status: teamA && teamB ? "live" : "upcoming",
              maps: randomMaps,
              mapScores: [],
              winner: null,
              round: nextRound + 1,
              matchNumber: i + 1,
              createdAt: new Date(),
              startTime: new Date(),
            };

            // Add the match to tournamentMatches
            await db
              .collection("Tournaments")
              .updateOne({ _id: tournament._id }, {
                $push: {
                  tournamentMatches: newMatch,
                },
              } as any);

            // Update the bracket with match ID and appropriate status
            await db.collection("Tournaments").updateOne(
              { _id: tournament._id },
              {
                $set: {
                  [`brackets.rounds.${nextRound}.matches.${i}.status`]:
                    teamA && teamB ? "live" : "upcoming",
                  [`brackets.rounds.${nextRound}.matches.${i}.tournamentMatchId`]:
                    nextMatchId,
                },
              }
            );
          }
        }
      }
    }

    // Check if this was the final round's match (determine if tournament is completed)
    const isFinalRound = nextRound >= tournament.brackets.rounds.length;

    if (isFinalRound || roundNum === tournament.brackets.rounds.length - 1) {
      console.log(
        "This appears to be the final round match. Checking for tournament completion..."
      );

      // Get the full tournament to check all matches
      const fullTournament = await db
        .collection("Tournaments")
        .findOne({ _id: tournament._id });

      if (!fullTournament) {
        console.error("Could not find tournament data for completion check");
        return NextResponse.json(
          { error: "Tournament data not found" },
          { status: 500 }
        );
      }

      // Check if all matches in all rounds are completed
      const allMatchesCompleted = fullTournament.tournamentMatches.every(
        (m: any) => m.status === "completed"
      );

      // Also check if this is the final round
      const finalRoundComplete = fullTournament.brackets.rounds[
        fullTournament.brackets.rounds.length - 1
      ].matches.every((m: any) => m.status === "completed");

      if (allMatchesCompleted && finalRoundComplete) {
        console.log(
          "All tournament matches completed. Finalizing tournament..."
        );

        // Get the winning team from the final match
        const finalMatch = fullTournament.tournamentMatches.find(
          (m: any) => m.round === fullTournament.brackets.rounds.length
        );

        if (!finalMatch) {
          console.error("Could not find final match");
          return NextResponse.json(
            { error: "Final match data not found" },
            { status: 500 }
          );
        }

        // Get the winning team
        const tournamentWinner =
          finalMatch.winner === "teamA" ? finalMatch.teamA : finalMatch.teamB;

        // Calculate team standings (W-L records)
        const teamRecords = new Map();

        // Initialize records for all registered teams
        fullTournament.registeredTeams.forEach((team: any) => {
          teamRecords.set(team._id.toString(), { team, wins: 0, losses: 0 });
        });

        // Count wins and losses from completed matches
        fullTournament.tournamentMatches.forEach((match: any) => {
          if (match.status === "completed" && match.winner) {
            const winningTeam =
              match.winner === "teamA" ? match.teamA : match.teamB;
            const losingTeam =
              match.winner === "teamA" ? match.teamB : match.teamA;

            if (winningTeam && losingTeam) {
              const winnerRecord = teamRecords.get(winningTeam._id.toString());
              const loserRecord = teamRecords.get(losingTeam._id.toString());

              if (winnerRecord) winnerRecord.wins += 1;
              if (loserRecord) loserRecord.losses += 1;
            }
          }
        });

        // Convert Map to array for MongoDB
        const teamStandings = Array.from(teamRecords.values());

        console.log(
          "Generated team standings:",
          JSON.stringify(teamStandings, null, 2)
        );

        // Update tournament status to completed and set winner
        await db.collection("Tournaments").updateOne(
          { _id: tournament._id },
          {
            $set: {
              status: "completed",
              winner: tournamentWinner,
              completedAt: new Date(),
              teamStandings: teamStandings,
            },
          }
        );

        console.log(
          `Tournament completed with ${tournamentWinner.name} as winner`
        );

        // Get the finalists (top 2 teams)
        const finalists = [tournamentWinner];

        // Find the runner-up team (the losing team in the final match)
        const runnerUp =
          finalMatch.winner === "teamA" ? finalMatch.teamB : finalMatch.teamA;
        if (runnerUp) {
          finalists.push(runnerUp);
        }

        // Find the 3rd place team (if applicable)
        let thirdPlace = null;
        if (fullTournament.brackets?.rounds?.length > 1) {
          // In a single elimination tournament, the 3rd place is typically determined
          // as the team that lost to the champion in the semifinal
          // Let's try to find the semifinals round
          const semiFinalRound =
            fullTournament.brackets.rounds[
              fullTournament.brackets.rounds.length - 2
            ];

          if (semiFinalRound && semiFinalRound.matches) {
            const champSemifinalMatch = semiFinalRound.matches.find(
              (match: any) => {
                const winnerTeam =
                  match.winner === "teamA" ? match.teamA : match.teamB;
                return (
                  winnerTeam &&
                  tournamentWinner &&
                  winnerTeam._id.toString() === tournamentWinner._id.toString()
                );
              }
            );

            if (champSemifinalMatch) {
              thirdPlace =
                champSemifinalMatch.winner === "teamA"
                  ? champSemifinalMatch.teamB
                  : champSemifinalMatch.teamA;

              if (thirdPlace) finalists.push(thirdPlace);
            }
          }
        }

        // Update each finalist's team document with their tournament result
        const tournamentResult = {
          tournamentId: tournament._id,
          tournamentName: fullTournament.name,
          date: new Date(),
        };

        for (let i = 0; i < finalists.length; i++) {
          const team = finalists[i];
          const placement = i + 1; // 1st, 2nd, or 3rd

          // Skip if no valid team
          if (!team || !team._id) continue;

          // Prepare the tournament result with placement
          const teamTournamentResult = {
            ...tournamentResult,
            placement:
              placement === 1 ? "1st" : placement === 2 ? "2nd" : "3rd",
          };

          // Update the team document in the Teams collection
          await db.collection("Teams").updateOne(
            { _id: new ObjectId(team._id.toString()) },
            {
              $push: {
                // MongoDB push format needs to be this way for TypeScript
                tournaments: teamTournamentResult,
              } as any, // Add type assertion to bypass TypeScript checking
              $set: {
                updatedAt: new Date(),
              },
            }
          );

          console.log(
            `Updated team ${team.name} with ${placement}${
              placement === 1 ? "st" : placement === 2 ? "nd" : "rd"
            } place finish`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Match winner set successfully",
      winningTeam: winningTeam === 1 ? match.teamA?.name : match.teamB?.name,
    });
  } catch (error) {
    console.error("Error setting match winner:", error);
    return NextResponse.json(
      { error: "Failed to set match winner" },
      { status: 500 }
    );
  }
}
