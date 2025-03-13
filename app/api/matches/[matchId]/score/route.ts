import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { emitMatchUpdate } from "@/lib/socket";
import { ObjectId } from "mongodb";

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

// Add these interfaces for type safety
interface MatchPlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  discordProfilePicture?: string;
  elo: number;
  eloChange?: number;
  updatedElo?: number;
}

interface MapScore {
  team1Score: number;
  team2Score: number;
  submittedByTeam1?: boolean;
  submittedByTeam2?: boolean;
  winner?: number;
  scoresVerified?: boolean;
}

// Update the validation helper
function validateRoundScores(
  team1Score: number,
  team2Score: number
): string | null {
  // Convert to numbers to ensure proper comparison
  const t1Score = Number(team1Score);
  const t2Score = Number(team2Score);

  // Check for valid numbers
  if (isNaN(t1Score) || isNaN(t2Score)) {
    return "Invalid score values";
  }

  // Check for negative scores
  if (t1Score < 0 || t2Score < 0) {
    return "Scores cannot be negative";
  }

  // Check for scores exceeding maximum
  if (t1Score > 6 || t2Score > 6) {
    return "Scores cannot exceed 6 rounds";
  }

  // Check for ties
  if (t1Score === t2Score) {
    return "Scores cannot be tied";
  }

  // Check that exactly one team has 6 rounds
  if (t1Score === 6 && t2Score === 6) {
    return "Only one team can have 6 rounds";
  }

  if (t1Score !== 6 && t2Score !== 6) {
    return "One team must win 6 rounds";
  }

  // Ensure losing team has less than 6 rounds
  if ((t1Score === 6 && t2Score >= 6) || (t2Score === 6 && t1Score >= 6)) {
    return "Only one team can have 6 rounds";
  }

  return null;
}

async function reinsertWinnersIntoQueue(
  db: any,
  match: any,
  matchWinner: number
) {
  try {
    // Get the winning team's player IDs
    const winningTeam = matchWinner === 1 ? match.team1 : match.team2;
    const winningPlayerIds = winningTeam.map((player: any) => player.discordId);

    // Fetch the CURRENT player documents to get UPDATED ELO values
    const playerDocs = await db
      .collection("Players")
      .find({ discordId: { $in: winningPlayerIds } })
      .toArray();

    // Create a map of player IDs to their current ELO values
    const playerEloMap = new Map();
    playerDocs.forEach((player: any) => {
      // Find the stats object with the matching team size
      const statsObj = player.stats?.find(
        (stat: any) => Number(stat.teamSize) === Number(match.teamSize)
      );

      if (statsObj) {
        playerEloMap.set(player.discordId, statsObj.elo);
      }
    });

    console.log(
      "Current ELO values for winners:",
      Array.from(playerEloMap.entries()).reduce<Record<string, number>>(
        (obj, [key, value]) => {
          obj[key] = value;
          return obj;
        },
        {}
      )
    );

    // Now build the players to add back to the queue with UPDATED ELO values
    const playersToAdd = winningTeam.map((player: any) => {
      // Get the current ELO from our map, fall back to original if not found
      const currentElo = playerEloMap.get(player.discordId) || player.elo;

      return {
        discordId: player.discordId,
        discordUsername: player.discordUsername,
        discordNickname: player.discordNickname,
        discordProfilePicture: player.discordProfilePicture,
        elo: currentElo, // Use the CURRENT ELO from player document
        joinedAt: Date.now(),
      };
    });

    // Add the winning team back to the queue
    await db
      .collection("Queues")
      .updateOne(
        { _id: match.queueId ? new ObjectId(match.queueId) : null },
        { $push: { players: { $each: playersToAdd } } }
      );

    console.log(
      `${playersToAdd.length} winners reinserted into queue ${match.queueId}`
    );
  } catch (error) {
    console.error("Error reinserting winners:", error);
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

// Improved ELO calculation function that considers:
// 1. Individual player ELO vs opposing team average
// 2. Round score difference (performance factor)
// 3. Dynamic K-factor based on player ELO
function calculateImprovedElo(
  playerElo: number,
  opposingTeamAvgElo: number,
  isWinner: boolean,
  roundDifference: number
): number {
  // Base K-factor (decreases as ELO increases)
  let kFactor = 32;
  if (playerElo > 2100) kFactor = 24;
  if (playerElo > 2400) kFactor = 16;

  // Calculate expected outcome using the standard ELO formula
  const expectedOutcome =
    1 / (1 + Math.pow(10, (opposingTeamAvgElo - playerElo) / 400));

  // Actual outcome (1 for win, 0 for loss)
  const actualOutcome = isWinner ? 1 : 0;

  // Performance factor based on round difference (0.5 to 1.5)
  // More decisive wins/losses result in larger changes
  const performanceFactor = Math.min(1.5, 0.5 + roundDifference / 12);

  // Calculate ELO change
  const eloChange = Math.round(
    kFactor * (actualOutcome - expectedOutcome) * performanceFactor
  );

  // Add logging to understand the calculation
  console.log(`ELO Change Calculation for player with ${playerElo} ELO:`, {
    opposingTeamAvgElo,
    expectedOutcome: expectedOutcome.toFixed(4),
    actualOutcome,
    kFactor,
    performanceFactor: performanceFactor.toFixed(2),
    roundDifference,
    eloChange,
  });

  return eloChange;
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

    // Validate scores before processing
    const scoreError = validateRoundScores(team1Score, team2Score);
    if (scoreError) {
      return NextResponse.json({ error: scoreError }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Find the match
    const match = await db.collection("Matches").findOne({
      matchId: params.matchId,
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get the submitting player's info
    const submittingUser = {
      discordId: session.user.id,
      discordUsername: session.user.name,
      discordNickname: session.user.name,
    };

    // Get the player document to get their nickname
    const player = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    if (player) {
      submittingUser.discordNickname = player.discordNickname;
    }

    // Initialize mapScores if it doesn't exist
    const mapScores = match.mapScores || [];
    const existingMapScore = mapScores[mapIndex] || {};

    // Create the update field based on submitting team
    const updateField =
      submittingTeam === 1
        ? {
            submittedByTeam1: true,
            submittedByTeam1User: submittingUser,
            submittedByTeam2: existingMapScore.submittedByTeam2 || false,
            submittedByTeam2User: existingMapScore.submittedByTeam2User,
          }
        : {
            submittedByTeam1: existingMapScore.submittedByTeam1 || false,
            submittedByTeam1User: existingMapScore.submittedByTeam1User,
            submittedByTeam2: true,
            submittedByTeam2User: submittingUser,
          };

    // Update the map score
    mapScores[mapIndex] = {
      ...existingMapScore,
      ...(submittingTeam === 1
        ? {
            team1SubmittedByTeam1Score: team1Score,
            team2SubmittedByTeam1Score: team2Score,
          }
        : {
            team1SubmittedByTeam2Score: team1Score,
            team2SubmittedByTeam2Score: team2Score,
          }),
      ...updateField,
    };

    // Check if both teams have submitted and scores match
    if (
      mapScores[mapIndex].submittedByTeam1 &&
      mapScores[mapIndex].submittedByTeam2
    ) {
      const scoresMatch = doScoresMatch(mapScores[mapIndex]);

      if (scoresMatch) {
        const scoreError = validateRoundScores(team1Score, team2Score);
        if (!scoreError) {
          const winner = team1Score === 6 ? 1 : 2;

          // Update just the map scores without ELO changes
          mapScores[mapIndex] = {
            ...mapScores[mapIndex],
            team1Score,
            team2Score,
            winner,
            scoresVerified: true,
          };
        }
      } else {
        mapScores[mapIndex] = {
          submittedByTeam1: false,
          submittedByTeam2: false,
          scoresVerified: false,
          scoresMismatch: true,
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

    // If match is complete (someone has 2 wins), calculate and update ELOs
    if (team1Wins === 2 || team2Wins === 2) {
      try {
        const matchWinner = team1Wins === 2 ? 1 : 2;

        // Calculate team average ELOs
        const team1AvgElo =
          match.team1.reduce((sum: number, p: MatchPlayer) => sum + p.elo, 0) /
          match.team1.length;
        const team2AvgElo =
          match.team2.reduce((sum: number, p: MatchPlayer) => sum + p.elo, 0) /
          match.team2.length;

        // Calculate total round difference across all maps
        let team1TotalRoundWins = 0;
        let team2TotalRoundWins = 0;

        mapScores.forEach((score: MapScore) => {
          team1TotalRoundWins += score.team1Score || 0;
          team2TotalRoundWins += score.team2Score || 0;
        });

        const team1RoundDiff = team1TotalRoundWins - team2TotalRoundWins;
        const team2RoundDiff = team2TotalRoundWins - team1TotalRoundWins;

        // Update each player's ELO with the improved calculation
        const updatedTeam1 = match.team1.map((player: MatchPlayer) => {
          const eloChange = calculateImprovedElo(
            player.elo,
            team2AvgElo,
            matchWinner === 1, // true if team1 won
            Math.abs(team1RoundDiff)
          );

          return {
            ...player,
            eloChange,
            updatedElo: Math.max(0, player.elo + eloChange), // Ensure ELO never goes below 0
          };
        });

        const updatedTeam2 = match.team2.map((player: MatchPlayer) => {
          const eloChange = calculateImprovedElo(
            player.elo,
            team1AvgElo,
            matchWinner === 2, // true if team2 won
            Math.abs(team2RoundDiff)
          );

          return {
            ...player,
            eloChange,
            updatedElo: Math.max(0, player.elo + eloChange), // Ensure ELO never goes below 0
          };
        });

        // Update match document with final scores, winner, and ELO changes
        await db.collection("Matches").updateOne(
          { matchId: params.matchId },
          {
            $set: {
              mapScores,
              lastUpdatedAt: new Date(),
              status: "completed",
              winner: matchWinner,
              completedAt: new Date(),
              team1MapWins: team1Wins,
              team2MapWins: team2Wins,
              // Store teams with ELO changes in match document
              team1: updatedTeam1.map((player: MatchPlayer) => ({
                ...player,
                // Keep original elo and eloChange for match history
                elo: player.elo,
                eloChange: player.eloChange,
                // Remove updatedElo as it's not needed in match document
                updatedElo: undefined,
              })),
              team2: updatedTeam2.map((player: MatchPlayer) => ({
                ...player,
                // Keep original elo and eloChange for match history
                elo: player.elo,
                eloChange: player.eloChange,
                // Remove updatedElo as it's not needed in match document
                updatedElo: undefined,
              })),
            },
          }
        );

        // Update player ELOs in their stats arrays with the new calculated ELO
        const playerUpdates = [...updatedTeam1, ...updatedTeam2].map(
          async (player) => {
            // First get the player document to find the correct stats index
            const playerDoc = await db
              .collection("Players")
              .findOne({ discordId: player.discordId });

            if (!playerDoc || !playerDoc.stats) {
              console.error(
                `Player ${player.discordId} not found or has no stats array`
              );
              return null;
            }

            // Find the index of the stats object with the matching teamSize
            const statsIndex = playerDoc.stats.findIndex(
              (stat: { teamSize: any }) =>
                Number(stat.teamSize) === Number(match.teamSize)
            );

            if (statsIndex === -1) {
              console.error(
                `Could not find stats object with teamSize ${match.teamSize} for player ${player.discordId}`
              );
              console.log("Available stats:", playerDoc.stats);
              return null;
            }

            // Update the correct stats object using its index
            return db.collection("Players").updateOne(
              { discordId: player.discordId },
              {
                $set: {
                  [`stats.${statsIndex}.elo`]: player.updatedElo,
                  [`stats.${statsIndex}.lastMatchDate`]: new Date(),
                },
              }
            );
          }
        );

        // Wait for all updates to complete
        await Promise.all(playerUpdates.filter((update) => update !== null));

        // Handle Winners Stay
        await reinsertWinnersIntoQueue(db, match, matchWinner);
      } catch (error) {
        console.error("Error completing match:", error);
        throw error;
      }
    } else {
      // Just update map scores if match isn't complete
      const result = await db.collection("Matches").updateOne(
        { matchId: params.matchId },
        {
          $set: {
            mapScores,
            lastUpdatedAt: new Date(),
          },
        }
      );
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
