interface PlayerStats {
  wins: number;
  losses: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  matchesPlayed: number;
  averageScore: number;
  winStreak: number;
  longestWinStreak: number;
}

export async function updatePlayerStats(db: any, match: any) {
  const winner = match.team1Score > match.team2Score ? 1 : 2;
  const winningTeam = winner === 1 ? match.team1Players : match.team2Players;
  const losingTeam = winner === 1 ? match.team2Players : match.team1Players;

  // Update winners' stats
  for (const playerId of winningTeam) {
    await db.collection("PlayerStats").updateOne(
      { playerId },
      {
        $inc: {
          wins: 1,
          matchesPlayed: 1,
          totalKills: match.playerStats[playerId]?.kills || 0,
          totalDeaths: match.playerStats[playerId]?.deaths || 0,
          totalAssists: match.playerStats[playerId]?.assists || 0,
          winStreak: 1,
        },
        $max: {
          longestWinStreak: { $add: ["$winStreak", 1] },
        },
      },
      { upsert: true }
    );
  }

  // Update losers' stats
  for (const playerId of losingTeam) {
    await db.collection("PlayerStats").updateOne(
      { playerId },
      {
        $inc: {
          losses: 1,
          matchesPlayed: 1,
          totalKills: match.playerStats[playerId]?.kills || 0,
          totalDeaths: match.playerStats[playerId]?.deaths || 0,
          totalAssists: match.playerStats[playerId]?.assists || 0,
        },
        $set: {
          winStreak: 0,
        },
      },
      { upsert: true }
    );
  }
}

export async function getPlayerStats(
  db: any,
  playerId: string
): Promise<PlayerStats> {
  const stats = await db.collection("PlayerStats").findOne({ playerId });
  if (!stats) {
    return {
      wins: 0,
      losses: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      matchesPlayed: 0,
      averageScore: 0,
      winStreak: 0,
      longestWinStreak: 0,
    };
  }

  return {
    ...stats,
    averageScore:
      stats.matchesPlayed > 0
        ? (stats.totalKills * 100 + stats.totalAssists * 50) /
          stats.matchesPlayed
        : 0,
  };
}
