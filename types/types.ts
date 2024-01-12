export type PlayerStats = {
  teamSize: number;
  elo: number;
  kills: number;
  deaths: number;
  resurrects: number;
  avgMoney: number;
};

export type Player = {
  playerId: string;
  discordId: string;
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

export type Video = {
  title: string;
  src: string;
  isFeatured: string;
  isTutorial: string;
  datePublished: string;
  category: string;
};

export type Post = {
  title: string;
  src: string;
  description: string;
  isTutorial: string;
  author: string;
  datePublished: string;
  linkAddress: string;
  altText: string;
};

export type Roster = {
  staffName: string;
  src: string;
  staffTitle: string;
  staffNicknames: string;
  staffAltText: string;
  staffOrder: string;
  altText: string;
};
