import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const playerId = params.id;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    // Find matches where player participated - handle multiple match structures
    const matches = await db
      .collection("Matches")
      .find({
        $or: [
          { "teamA.players.discordId": playerId },
          { "teamB.players.discordId": playerId },
          { "team1.players.discordId": playerId },
          { "team2.players.discordId": playerId },
          { "teams.teamA": playerId },
          { "teams.teamB": playerId },
          { "team1Players": playerId },
          { "team2Players": playerId },
        ],
        status: { $in: ["completed", "confirmed"] },
      })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(limit)
      .toArray();

    // Format matches for display
    const formattedMatches = matches
      .map((match: any) => {
        // Determine which team structure is used
        let playerTeam: string;
        let opponentTeam: string;
        let playerTeamPlayers: any[] = [];
        let opponentTeamPlayers: any[] = [];
        let playerScore = 0;
        let opponentScore = 0;
        let playerWon = false;

        // Check different match structures
        if (match.teamA?.players || match.teamB?.players) {
          // Structure with teamA/teamB
          const inTeamA = match.teamA?.players?.some(
            (p: any) => p.discordId === playerId
          );
          playerTeam = inTeamA ? "teamA" : "teamB";
          opponentTeam = inTeamA ? "teamB" : "teamA";
          playerTeamPlayers = match[playerTeam]?.players || [];
          opponentTeamPlayers = match[opponentTeam]?.players || [];
          playerScore = match.scores?.[playerTeam] || 0;
          opponentScore = match.scores?.[opponentTeam] || 0;
          playerWon = match.winner === playerTeam;
        } else if (match.team1?.players || match.team2?.players) {
          // Structure with team1/team2
          const inTeam1 = match.team1?.players?.some(
            (p: any) => p.discordId === playerId
          );
          playerTeam = inTeam1 ? "team1" : "team2";
          opponentTeam = inTeam1 ? "team2" : "team1";
          playerTeamPlayers = match[playerTeam]?.players || [];
          opponentTeamPlayers = match[opponentTeam]?.players || [];
          playerScore = match.scores?.[playerTeam] || 0;
          opponentScore = match.scores?.[opponentTeam] || 0;
          playerWon = match.winner === playerTeam || match.winner === (inTeam1 ? 1 : 2);
        } else if (match.teams?.teamA || match.teams?.teamB) {
          // Structure with teams.teamA/teams.teamB (array of IDs)
          const inTeamA = match.teams?.teamA?.includes(playerId);
          playerTeam = inTeamA ? "teamA" : "teamB";
          opponentTeam = inTeamA ? "teamB" : "teamA";
          playerScore = match.scores?.[playerTeam] || 0;
          opponentScore = match.scores?.[opponentTeam] || 0;
          playerWon = match.winner === playerTeam;
          // For this structure, we don't have player details, just IDs
          playerTeamPlayers = (match.teams?.[playerTeam] || []).map((id: string) => ({
            discordId: id,
          }));
          opponentTeamPlayers = (match.teams?.[opponentTeam] || []).map((id: string) => ({
            discordId: id,
          }));
        } else {
          return null; // Unknown structure
        }

        return {
          _id: match._id.toString(),
          date: match.completedAt || match.createdAt || match.playedAt,
          teamSize: match.teamSize || match.gameType?.replace("v", "") || 4,
          playerTeam: {
            players: playerTeamPlayers.map((p: any) => ({
              discordId: p.discordId || p,
              discordNickname: p.discordNickname || p.discordUsername || "Unknown",
              elo: p.elo || 0,
            })),
            score: playerScore,
          },
          opponentTeam: {
            players: opponentTeamPlayers.map((p: any) => ({
              discordId: p.discordId || p,
              discordNickname: p.discordNickname || p.discordUsername || "Unknown",
              elo: p.elo || 0,
            })),
            score: opponentScore,
          },
          result: playerWon ? "win" : "loss",
          eloChange: match.eloChanges?.[playerId] || 0,
          map: match.map || match.maps?.[0] || "Unknown",
        };
      })
      .filter((match) => match !== null);

    return NextResponse.json({ matches: formattedMatches });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch match history" },
      { status: 500 }
    );
  }
}

