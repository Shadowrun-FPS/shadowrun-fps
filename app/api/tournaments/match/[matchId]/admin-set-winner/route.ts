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
          format: 1,
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

    // Set map scores as 2-0 (winning team wins first 2 maps)
    // Best of 3 means winning team needs 2 wins
    const mapScores =
      match.maps?.slice(0, 2).map((map: any, index: number) => ({
        mapName: map.mapName || map.name,
        gameMode: map.gameMode,
        team1Score: winningTeam === 1 ? 6 : 0,
        team2Score: winningTeam === 2 ? 6 : 0,
        winner: winningTeam, // 1 or 2
        submittedByTeamA: true,
        submittedByTeamB: true,
      })) || [];

    await db.collection("Tournaments").updateOne(
      { "tournamentMatches.tournamentMatchId": matchId },
      {
        $set: {
          [`tournamentMatches.${matchIndex}.winner`]: winner,
          [`tournamentMatches.${matchIndex}.status`]: "completed",
          [`tournamentMatches.${matchIndex}.completedAt`]: new Date(),
          [`tournamentMatches.${matchIndex}.mapScores`]: mapScores,
        },
      }
    );

    // Find and update the match in the brackets
    let bracketUpdated = false;
    let roundNum = 0;
    let matchNum = 0;
    let isLosersBracket = false;
    const losingTeamData = winningTeam === 1 ? match.teamB : match.teamA;

    // Find the match in brackets (check both winners and losers brackets)
    if (tournament.brackets && tournament.brackets.rounds) {
      // First check winners bracket
      for (let i = 0; i < tournament.brackets.rounds.length; i++) {
        const round = tournament.brackets.rounds[i];
        if (round.matches) {
          for (let j = 0; j < round.matches.length; j++) {
            if (round.matches[j].tournamentMatchId === matchId) {
              roundNum = i;
              matchNum = j;
              bracketUpdated = true;
              isLosersBracket = false;

              // Update the bracket with winner info
              await db.collection("Tournaments").updateOne(
                { _id: tournament._id },
                {
                  $set: {
                    [`brackets.rounds.${i}.matches.${j}.winner`]: winner,
                    [`brackets.rounds.${i}.matches.${j}.status`]: "completed",
                    [`brackets.rounds.${i}.matches.${j}.scores`]: {
                      teamA: winningTeam === 1 ? 2 : 0,
                      teamB: winningTeam === 2 ? 2 : 0,
                    },
                  },
                }
              );
              break;
            }
          }
          if (bracketUpdated) break;
        }
      }

      // If not found in winners bracket, check losers bracket (for double elimination)
      if (!bracketUpdated && tournament.brackets.losersRounds) {
        for (let i = 0; i < tournament.brackets.losersRounds.length; i++) {
          const round = tournament.brackets.losersRounds[i];
          if (round.matches) {
            for (let j = 0; j < round.matches.length; j++) {
              if (round.matches[j].tournamentMatchId === matchId) {
                roundNum = i;
                matchNum = j;
                bracketUpdated = true;
                isLosersBracket = true;

                // Update the bracket with winner info
                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $set: {
                      [`brackets.losersRounds.${i}.matches.${j}.winner`]:
                        winner,
                      [`brackets.losersRounds.${i}.matches.${j}.status`]:
                        "completed",
                      [`brackets.losersRounds.${i}.matches.${j}.scores`]: {
                        teamA: winningTeam === 1 ? 2 : 0,
                        teamB: winningTeam === 2 ? 2 : 0,
                      },
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

      if (!updatedTournament) {
        return NextResponse.json(
          { error: "Tournament data not found" },
          { status: 500 }
        );
      }

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

      // Handle double elimination logic
      if (tournament.format === "double_elimination" && !isLosersBracket) {
        // In winners bracket: winner advances in winners bracket, loser drops to losers bracket
        const losingTeamFullData = updatedTournament.registeredTeams.find(
          (t: any) => t._id.toString() === losingTeamData._id.toString()
        );

        if (losingTeamFullData) {
          // Create losers rounds if they don't exist
          if (
            !updatedTournament.brackets.losersRounds ||
            updatedTournament.brackets.losersRounds.length === 0
          ) {
            console.log(
              "Creating losers bracket rounds for double elimination tournament"
            );

            // Calculate base round count (winners bracket rounds before Grand Finals)
            // Total rounds includes Grand Finals and Decisive Match, so subtract 2
            const totalRounds = updatedTournament.brackets.rounds.length;
            const baseRoundCount = totalRounds - 2; // Subtract Grand Finals and Decisive Match
            const losersRoundCount = baseRoundCount + 1;
            const numTeams = updatedTournament.registeredTeams.length;

            const losersRounds: any[] = [];

            for (let i = 0; i < losersRoundCount; i++) {
              let matchCount = 0;

              if (i === 0) {
                // First losers round: pairs up losers from first winners round
                matchCount = Math.floor(numTeams / 4);
              } else if (i === 1) {
                // Second losers round: winners from LR1 + losers from WR2
                matchCount = Math.floor(numTeams / 4);
              } else if (i < baseRoundCount - 1) {
                // Middle losers rounds (LR3, LR4, etc. up to LR(baseRoundCount-1))
                // Pattern: Each round has half the matches of the previous round
                const divisor = Math.pow(2, i + 2); // 2^5=32 for LR3, 2^6=64 for LR4, etc.
                matchCount = Math.max(1, Math.floor(numTeams / divisor));
              } else if (i === baseRoundCount - 1) {
                // Second-to-last losers round: winner from previous LR + loser from WR(baseRoundCount)
                matchCount = 1;
              } else if (i === baseRoundCount) {
                // Last losers round: winner from previous LR + loser from Grand Finals
                // This determines the losers bracket champion
                matchCount = 1;
              }

              // Only create rounds with matches
              if (matchCount > 0) {
                const matches = [];
                for (let j = 0; j < matchCount; j++) {
                  matches.push({
                    matchId: `L${i + 1}-${j + 1}`,
                    scores: { teamA: 0, teamB: 0 },
                    status: "upcoming",
                  });
                }

                losersRounds.push({
                  name: `Losers Round ${i + 1}`,
                  matches,
                });
              }
            }

            // Create losers rounds in the tournament
            await db.collection("Tournaments").updateOne(
              { _id: tournament._id },
              {
                $set: {
                  "brackets.losersRounds": losersRounds,
                },
              }
            );

            // Refresh the tournament data
            const refreshedTournament = await db
              .collection("Tournaments")
              .findOne({ _id: tournament._id });

            if (refreshedTournament) {
              updatedTournament.brackets.losersRounds =
                refreshedTournament.brackets.losersRounds;
            }
          }

          // Drop losing team to losers bracket immediately
          if (
            updatedTournament.brackets.losersRounds &&
            updatedTournament.brackets.losersRounds.length > 0
          ) {
            // Calculate which losers round this loser should go to
            // WR1 losers → LR1, WR2 losers → LR2, WR3 losers → LR3, etc.
            const losersRoundIndex = roundNum;

            if (
              updatedTournament.brackets.losersRounds[losersRoundIndex] &&
              updatedTournament.brackets.losersRounds[losersRoundIndex].matches
                .length > 0
            ) {
              if (roundNum === 0) {
                // First round: losers go to Losers Round 1
                // Pair up: Match 0&1 losers → LR1 Match 0, Match 2&3 losers → LR1 Match 1, etc.
                const losersMatchIndex = Math.floor(matchNum / 2);
                const isFirstLoser = matchNum % 2 === 0;
                const losersUpdateField = isFirstLoser ? "teamA" : "teamB";

                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $set: {
                      [`brackets.losersRounds.${losersRoundIndex}.matches.${losersMatchIndex}.${losersUpdateField}`]:
                        losingTeamFullData,
                    },
                  }
                );
              } else if (roundNum === 1) {
                // Winners Round 2 losers go to Losers Round 2
                // Place WR2 losers into LR2 matches (same match index)
                const losersMatchIndex = matchNum;
                const match =
                  updatedTournament.brackets.losersRounds[losersRoundIndex]
                    .matches[losersMatchIndex];
                const updateField = !match.teamB ? "teamB" : "teamA"; // Losers go to teamB slot

                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $set: {
                      [`brackets.losersRounds.${losersRoundIndex}.matches.${losersMatchIndex}.${updateField}`]:
                        losingTeamFullData,
                    },
                  }
                );
              } else {
                // Winners Round 3+ losers go to corresponding Losers Round
                // For rounds with only 1 match, place the loser there
                const match =
                  updatedTournament.brackets.losersRounds[losersRoundIndex]
                    .matches[0];
                const updateField = !match.teamB ? "teamB" : "teamA"; // Loser goes to teamB

                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $set: {
                      [`brackets.losersRounds.${losersRoundIndex}.matches.0.${updateField}`]:
                        losingTeamFullData,
                    },
                  }
                );
              }
            }
          }
        }
      }

      // Advance winner to next round in the same bracket
      const bracketRounds = isLosersBracket
        ? updatedTournament.brackets?.losersRounds
        : updatedTournament.brackets?.rounds;

      if (bracketRounds && bracketRounds[nextRound]) {
        // Special handling for losers bracket advancement
        let nextMatchIndex = 0;
        let updateField = "teamA";

        if (isLosersBracket && roundNum === 0 && nextRound === 1) {
          // LR1 → LR2: Winners go to corresponding LR2 matches
          // LR1 Match 0 winner → LR2 Match 0 teamA
          // LR1 Match 1 winner → LR2 Match 1 teamA
          nextMatchIndex = matchNum; // Same match index
          updateField = "teamA"; // LR1 winners go to teamA slot
        } else if (isLosersBracket && roundNum === 1 && nextRound === 2) {
          // LR2 → LR3: Winners from LR2 go to LR3
          // If LR3 has multiple matches, use same index; if 1 match, combine
          if (bracketRounds[nextRound].matches.length > 1) {
            nextMatchIndex = matchNum; // Same match index if multiple matches
            updateField = "teamA";
          } else {
            nextMatchIndex = 0; // Single match
            const nextMatch = bracketRounds[nextRound].matches[0];
            updateField = !nextMatch.teamA ? "teamA" : "teamB";
          }
        } else if (
          isLosersBracket &&
          roundNum >= 2 &&
          nextRound < bracketRounds.length - 1
        ) {
          // LR3+ → Next LR: Winners advance to next round
          // If next round has 1 match, go there; otherwise use standard logic
          if (bracketRounds[nextRound].matches.length === 1) {
            nextMatchIndex = 0;
            const nextMatch = bracketRounds[nextRound].matches[0];
            updateField = !nextMatch.teamA ? "teamA" : "teamB";
          } else {
            // Multiple matches in next round - use standard pairing logic
            nextMatchIndex = Math.floor(matchNum / 2);
            const isFirstTeam = matchNum % 2 === 0;
            updateField = isFirstTeam ? "teamA" : "teamB";
          }
        } else {
          // Standard advancement logic for other rounds
          nextMatchIndex = Math.floor(matchNum / 2);
          const isFirstTeam = matchNum % 2 === 0;
          updateField = isFirstTeam ? "teamA" : "teamB";
        }

        const bracketPath = isLosersBracket
          ? `brackets.losersRounds.${nextRound}.matches.${nextMatchIndex}.${updateField}`
          : `brackets.rounds.${nextRound}.matches.${nextMatchIndex}.${updateField}`;

        await db.collection("Tournaments").updateOne(
          { _id: tournament._id },
          {
            $set: {
              [bracketPath]: fullTeamData,
            },
          }
        );
      } else if (
        isLosersBracket &&
        tournament.format === "double_elimination"
      ) {
        // Losers bracket champion - advance to Grand Finals
        const losersBracketFinalRound =
          updatedTournament.brackets.losersRounds.length - 1;
        if (roundNum === losersBracketFinalRound) {
          // This is the losers bracket final - winner goes to Grand Finals as teamB
          // Grand Finals is at index baseRoundCount (0-indexed)
          // Calculate baseRoundCount: total rounds - 2 (Grand Finals and Decisive Match)
          const totalRounds = updatedTournament.brackets.rounds.length;
          const baseRoundCount = totalRounds - 2;
          const grandFinalsRoundIndex = baseRoundCount;
          if (
            updatedTournament.brackets.rounds[grandFinalsRoundIndex] &&
            updatedTournament.brackets.rounds[grandFinalsRoundIndex].matches[0]
          ) {
            await db.collection("Tournaments").updateOne(
              { _id: tournament._id },
              {
                $set: {
                  [`brackets.rounds.${grandFinalsRoundIndex}.matches.0.teamB`]:
                    fullTeamData,
                },
              }
            );
            console.log(
              `Losers bracket champion ${fullTeamData.name} advanced to Grand Finals (WR4)`
            );
          }
        }
      }

      // Handle Winners Bracket Final → Grand Finals
      if (!isLosersBracket && tournament.format === "double_elimination") {
        // Calculate baseRoundCount: total rounds - 2 (Grand Finals and Decisive Match)
        const totalRounds = updatedTournament.brackets.rounds.length;
        const baseRoundCount = totalRounds - 2;

        // Check if this is the winners bracket final (roundNum === baseRoundCount - 1)
        // and nextRound would be Grand Finals (baseRoundCount)
        if (roundNum === baseRoundCount - 1 && nextRound === baseRoundCount) {
          // Winners bracket champion advances to Grand Finals as teamA
          const grandFinalsRoundIndex = baseRoundCount;
          if (
            updatedTournament.brackets.rounds[grandFinalsRoundIndex] &&
            updatedTournament.brackets.rounds[grandFinalsRoundIndex].matches[0]
          ) {
            await db.collection("Tournaments").updateOne(
              { _id: tournament._id },
              {
                $set: {
                  [`brackets.rounds.${grandFinalsRoundIndex}.matches.0.teamA`]:
                    fullTeamData,
                },
              }
            );
            console.log(
              `Winners bracket champion ${fullTeamData.name} advanced to Grand Finals (WR4)`
            );
          }
        }

        // Check if all matches in the current round are completed (use correct bracket)
        const currentBracketRounds = isLosersBracket
          ? updatedTournament.brackets?.losersRounds
          : updatedTournament.brackets?.rounds;

        const allMatchesCompleted =
          currentBracketRounds?.[roundNum]?.matches?.every(
            (m: any) => m.status === "completed"
          ) || false;

        // If all matches in this round are completed, create matches for the next round
        if (allMatchesCompleted && bracketRounds && bracketRounds[nextRound]) {
          console.log(
            `All matches in Round ${roundNum} are completed. Creating next round matches.`
          );

          // Get all matches in the next round from the bracket (use correct bracket)
          const nextRoundBracketMatches =
            bracketRounds[nextRound]?.matches || [];

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
            // Use the latest tournament data for bracket matches (use correct bracket)
            const bracketMatch =
              latestTournament.brackets[
                isLosersBracket ? "losersRounds" : "rounds"
              ][nextRound].matches[i];

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

            // Update the bracket with match ID and appropriate status (use correct bracket)
            const bracketUpdatePath = isLosersBracket
              ? `brackets.losersRounds.${nextRound}.matches.${i}`
              : `brackets.rounds.${nextRound}.matches.${i}`;

            await db.collection("Tournaments").updateOne(
              { _id: tournament._id },
              {
                $set: {
                  [`${bracketUpdatePath}.status`]:
                    teamA && teamB ? "live" : "upcoming",
                  [`${bracketUpdatePath}.tournamentMatchId`]: nextMatchId,
                },
              }
            );
          }
        }
      }

      // Handle Grand Finals completion for double elimination
      // Check if this match is Grand Finals by checking the matchId pattern
      // Grand Finals is always the round after the base winners bracket rounds
      if (tournament.format === "double_elimination") {
        // Calculate which round is Grand Finals
        const totalRounds = tournament.brackets.rounds.length;
        const baseRoundCount = totalRounds - 2; // Subtract Grand Finals and Decisive Match
        const grandFinalsRoundNumber = baseRoundCount + 1; // 1-indexed round number

        // Check if this match is in Grand Finals
        if (matchId.includes(`-R${grandFinalsRoundNumber}-`)) {
          // Fetch the latest tournament data to check Grand Finals status
          const latestTournamentForGF = await db
            .collection("Tournaments")
            .findOne({ _id: tournament._id });

          if (!latestTournamentForGF) {
            return NextResponse.json(
              { error: "Tournament data not found" },
              { status: 500 }
            );
          }

          // Grand Finals completed - check if winners bracket champion won
          const totalRoundsForGF = latestTournamentForGF.brackets.rounds.length;
          const baseRoundCountForGF = totalRoundsForGF - 2; // Subtract Grand Finals and Decisive Match
          const grandFinalsRoundIndex = baseRoundCountForGF; // 0-indexed
          const grandFinalsMatch =
            latestTournamentForGF.brackets.rounds[grandFinalsRoundIndex]
              ?.matches?.[0];
          if (
            grandFinalsMatch?.status === "completed" &&
            grandFinalsMatch.winner
          ) {
            const winnersBracketChampion = grandFinalsMatch.teamA;
            const losersBracketChampion = grandFinalsMatch.teamB;
            const grandFinalsWinner =
              grandFinalsMatch.winner === "teamA"
                ? winnersBracketChampion
                : losersBracketChampion;

            if (grandFinalsMatch.winner === "teamA") {
              // Winners bracket champion won Grand Finals → Tournament complete
              console.log(
                `Winners bracket champion ${winnersBracketChampion?.name} won Grand Finals - Tournament complete!`
              );

              // Calculate team standings and complete tournament
              const fullTournament = await db
                .collection("Tournaments")
                .findOne({ _id: tournament._id });

              if (fullTournament) {
                const teamRecords = new Map();
                fullTournament.registeredTeams.forEach((team: any) => {
                  teamRecords.set(team._id.toString(), {
                    team,
                    wins: 0,
                    losses: 0,
                  });
                });

                fullTournament.tournamentMatches.forEach((match: any) => {
                  if (match.status === "completed" && match.winner) {
                    const winningTeam =
                      match.winner === "teamA" ? match.teamA : match.teamB;
                    const losingTeam =
                      match.winner === "teamA" ? match.teamB : match.teamA;

                    if (winningTeam && losingTeam) {
                      const winnerRecord = teamRecords.get(
                        winningTeam._id.toString()
                      );
                      const loserRecord = teamRecords.get(
                        losingTeam._id.toString()
                      );

                      if (winnerRecord) winnerRecord.wins += 1;
                      if (loserRecord) loserRecord.losses += 1;
                    }
                  }
                });

                const teamStandings = Array.from(teamRecords.values());

                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $set: {
                      status: "completed",
                      winner: winnersBracketChampion,
                      completedAt: new Date(),
                      teamStandings: teamStandings,
                    },
                  }
                );
              }
            } else {
              // Losers bracket champion won Grand Finals → Create Decisive Match
              console.log(
                `Losers bracket champion ${losersBracketChampion?.name} won Grand Finals - Decisive Match needed!`
              );

              // Create Decisive Match with both teams
              const decisiveMatchRoundIndex = baseRoundCountForGF + 1; // Decisive Match is after Grand Finals
              if (
                latestTournamentForGF.brackets.rounds[
                  decisiveMatchRoundIndex
                ] &&
                latestTournamentForGF.brackets.rounds[decisiveMatchRoundIndex]
                  .matches[0]
              ) {
                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $set: {
                      [`brackets.rounds.${decisiveMatchRoundIndex}.matches.0.teamA`]:
                        winnersBracketChampion,
                      [`brackets.rounds.${decisiveMatchRoundIndex}.matches.0.teamB`]:
                        losersBracketChampion,
                      [`brackets.rounds.${decisiveMatchRoundIndex}.matches.0.status`]:
                        "live",
                    },
                  }
                );

                // Create the tournament match for WR5
                const rankedMaps = await db
                  .collection("Maps")
                  .find({ rankedMap: true })
                  .toArray();

                const allMapsWithVariants: any[] = [];
                rankedMaps.forEach((map: any) => {
                  allMapsWithVariants.push({
                    _id: map._id,
                    name: map.name,
                    gameMode: map.gameMode,
                    src: map.src,
                    isSmall: false,
                  });
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

                const decisiveMatchRoundNumber = baseRoundCountForGF + 2; // 1-indexed round number
                const decisiveMatchId = `${tournament._id.toString()}-R${decisiveMatchRoundNumber}-M1`;
                const newMatch = {
                  tournamentMatchId: decisiveMatchId,
                  teamA: winnersBracketChampion,
                  teamB: losersBracketChampion,
                  status: "live",
                  maps: randomMaps,
                  mapScores: [],
                  winner: null,
                  round: decisiveMatchRoundNumber,
                  matchNumber: 1,
                  createdAt: new Date(),
                  startTime: new Date(),
                };

                await db.collection("Tournaments").updateOne(
                  { _id: tournament._id },
                  {
                    $push: { tournamentMatches: newMatch } as any,
                    $set: {
                      [`brackets.rounds.${decisiveMatchRoundIndex}.matches.0.tournamentMatchId`]:
                        decisiveMatchId,
                    },
                  }
                );

                console.log("Decisive Match (WR5) created");
              }
            }
          }
        }
      }

      // Handle Decisive Match completion
      // Check if this match is Decisive Match by checking the matchId pattern
      if (tournament.format === "double_elimination") {
        // Calculate which round is Decisive Match
        const totalRounds = tournament.brackets.rounds.length;
        const baseRoundCount = totalRounds - 2; // Subtract Grand Finals and Decisive Match
        const decisiveMatchRoundNumber = baseRoundCount + 2; // 1-indexed round number

        // Check if this match is in Decisive Match
        if (matchId.includes(`-R${decisiveMatchRoundNumber}-`)) {
          // Fetch the latest tournament data to check Decisive Match status
          const latestTournamentForWR5 = await db
            .collection("Tournaments")
            .findOne({ _id: tournament._id });

          if (!latestTournamentForWR5) {
            return NextResponse.json(
              { error: "Tournament data not found" },
              { status: 500 }
            );
          }

          // Decisive Match completed → Tournament complete
          const totalRoundsForDM =
            latestTournamentForWR5.brackets.rounds.length;
          const baseRoundCountForDM = totalRoundsForDM - 2; // Subtract Grand Finals and Decisive Match
          const decisiveMatchRoundIndex = baseRoundCountForDM + 1; // 0-indexed
          const decisiveMatch =
            latestTournamentForWR5.brackets.rounds[decisiveMatchRoundIndex]
              ?.matches?.[0];
          if (decisiveMatch?.status === "completed" && decisiveMatch.winner) {
            const tournamentWinner =
              decisiveMatch.winner === "teamA"
                ? decisiveMatch.teamA
                : decisiveMatch.teamB;

            console.log(
              `Decisive Match winner ${tournamentWinner?.name} is the Tournament Champion!`
            );

            // Calculate team standings and complete tournament
            const fullTournament = await db
              .collection("Tournaments")
              .findOne({ _id: tournament._id });

            if (fullTournament) {
              const teamRecords = new Map();
              fullTournament.registeredTeams.forEach((team: any) => {
                teamRecords.set(team._id.toString(), {
                  team,
                  wins: 0,
                  losses: 0,
                });
              });

              fullTournament.tournamentMatches.forEach((match: any) => {
                if (match.status === "completed" && match.winner) {
                  const winningTeam =
                    match.winner === "teamA" ? match.teamA : match.teamB;
                  const losingTeam =
                    match.winner === "teamA" ? match.teamB : match.teamA;

                  if (winningTeam && losingTeam) {
                    const winnerRecord = teamRecords.get(
                      winningTeam._id.toString()
                    );
                    const loserRecord = teamRecords.get(
                      losingTeam._id.toString()
                    );

                    if (winnerRecord) winnerRecord.wins += 1;
                    if (loserRecord) loserRecord.losses += 1;
                  }
                }
              });

              const teamStandings = Array.from(teamRecords.values());

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
            }
          }
        }
      }
    }

    // Check if this was the final round's match (determine if tournament is completed)
    // For double elimination, we handle completion above for WR4 and WR5
    if (tournament.format !== "double_elimination") {
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
                const winnerRecord = teamRecords.get(
                  winningTeam._id.toString()
                );
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
                    winnerTeam._id.toString() ===
                      tournamentWinner._id.toString()
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
