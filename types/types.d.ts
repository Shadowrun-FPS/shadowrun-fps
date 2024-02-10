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
  userName: string;
  playerId: string;
  discordId: string;
  discordNickname: string;
  discordProfilePicture: string;
  stats: PlayerStats[];
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
  name: string;
  gameMode: string;
  rankedMap: boolean;
  smallOption: boolean;
  src: string;
};

export type MapResults = {
  map: 1 | 2 | 3;
  scoredBy: string;
  scores: {
    team1: TeamScore;
    team2: TeamScore;
  };
};

export type TeamScore = { rounds: number; team: Team };

export type Team = "RNA" | "Lineage";

export type Match = {
  matchId: string;
  title: string;
  gameType: "ranked" | "casual" | "public";
  status: MatchStatus;
  maps: Map[];
  players: Player[];
  teamSize: number;
  createdBy: string;
  createdTS: number;
  eloTier: "low" | "medium" | "high";
  anonymous: boolean;
  results?: MapResults[];
  winner?: string;
};

export type MatchStatus = "queue" | "in-progress" | "complete";

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

export type staffRoster = {
  staffName: string;
  staffNicknames: string;
  src: string;
  altText: string;
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
  Published: boolean;
  linkAddress: string;
  altText: string;
  category: string;
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

export type rankedMaps = {
  map: string;
  captureGameMode: string;
  rankedMap: boolean;
  smallOption: boolean;
  src: string;
};
