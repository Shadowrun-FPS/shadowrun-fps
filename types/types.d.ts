export type PlayerStats = {
  teamSize: number;
  elo: number;
  kills: number;
  deaths: number;
  resurrects: number;
  avgMoney: number;
  wins: number;
  losses: number;
  lastMatchDate: Date;
};

export type Player = {
  playerId: string;
  discordId: string;
  discordNickname: string;
  discordProfilePicture: string;
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

export type Map = {
  mapName: string;
  gameMode: string;
  scoredBy?: MapScore;
  players?: PlayerInfo[];
  result?: string;
  finalScores?: {
    team1: number;
    team2: number;
  };
};

export type Match = {
  matchId: string;
  gameType: "ranked" | "casual" | "public";
  status: "queue" | "in-progress" | "complete";
  maps: Map[];
  players: Player[];
  teamSize: number;
  createdBy: string;
  createdTS: number;
  eloTier: "low" | "medium" | "high";
  anonymous: boolean;
  winner?: string;
};

export type EloRank =
  | "Bronze V"
  | "Bronze IV"
  | "Bronze III"
  | "Bronze II"
  | "Bronze I"
  | "Silver V"
  | "Silver IV"
  | "Silver III"
  | "Silver II"
  | "Silver I"
  | "Gold V"
  | "Gold IV"
  | "Gold III"
  | "Gold II"
  | "Gold I"
  | "Platinum V"
  | "Platinum IV"
  | "Platinum III"
  | "Platinum II"
  | "Platinum I"
  | "Diamond V"
  | "Diamond IV"
  | "Diamond III"
  | "Diamond II"
  | "Diamond I";

export type EloRankGroup =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond";
