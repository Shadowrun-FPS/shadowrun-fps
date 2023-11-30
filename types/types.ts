export type PlayerStats = {
  teamSize: number;
  elo: number;
  kills: number;
  deaths: number;
  resurrects: number;
  avgMoney: number;
  lastMatchDate: Date;
};

export type Player = {
  playerId: string;
  discordId: string;
  discordNickname: string;
  stats: PlayerStats[];
};

export type MapScore = {
  team1: string;
  team2: string;
};

export type PlayerInfo = {
  playerId: string;
  team: string;
  kills: number;
  deaths: number;
  resurrects: number;
  totalMoneyEarned: number;
};

export type MapResult = {
  mapName: string;
  gameMode: string;
  scoredBy: MapScore;
  players: PlayerInfo[];
  result: string;
  finalScores: {
    team1: number;
    team2: number;
  };
};

export type MatchResult = {
  matchId: string;
  gameMode: string;
  queueId: string;
  ranked: boolean;
  maps: MapResult[];
  players: Player[];
  teamSize: number;
  winner: string;
};
