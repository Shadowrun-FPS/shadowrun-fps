interface Player {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
}

interface Team {
  players: Player[];
  averageElo: number;
}

export function balanceTeams(players: Player[]): { team1: Team; team2: Team } {
  // Sort players by ELO in descending order
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);
  const team1Players: Player[] = [];
  const team2Players: Player[] = [];
  let team1Elo = 0;
  let team2Elo = 0;

  // Use snake draft pattern to distribute players (1,2,2,1,1,2,2,1)
  sortedPlayers.forEach((player, index) => {
    if (index % 4 < 2) {
      team1Players.push(player);
      team1Elo += player.elo;
    } else {
      team2Players.push(player);
      team2Elo += player.elo;
    }
  });

  return {
    team1: {
      players: team1Players,
      averageElo: team1Elo / team1Players.length,
    },
    team2: {
      players: team2Players,
      averageElo: team2Elo / team2Players.length,
    },
  };
}

export function calculateMatchQuality(team1: Team, team2: Team): number {
  const eloDifference = Math.abs(team1.averageElo - team2.averageElo);
  const maxEloDifference = 400; // Maximum acceptable ELO difference

  // Quality score from 0 to 1, where 1 is perfect balance
  return Math.max(0, 1 - eloDifference / maxEloDifference);
}
