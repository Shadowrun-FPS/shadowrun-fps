export interface IPlayer {
  playerId: string;
  discordId: string;
  stats: [
    {
      teamSize: number;
      elo: number;
      kills: number;
      deaths: number;
      resurrects: number;
      avgMoney: number;
    }
  ];
}
export interface IPlayerResults {
  playerId: string;
  team: string;
  kills: number;
  deaths: number;
  resurrects: number;
  totalMoneyEarned: number;
}

export interface IMapScore {
  team1: string;
  team2: string;
}

export interface IMap {
  mapName: string;
  gameMode: string;
  scoredBy: IMapScore;
  playerResults: IPlayerResults[];
  result: string;
  finalScores: IMapScore;
}

export interface IMatch {
  matchId: string;
  gameMode: string;
  queueId: string;
  ranked: boolean;
  maps: IMap[];
  players: IPlayer[];
  teamSize: number;
  winner: string;
}
