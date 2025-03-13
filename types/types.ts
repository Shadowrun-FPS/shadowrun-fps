import { ReactNode } from "react";

export type TeamNumber = 1 | 2;

export interface Post {
  src: string;
  altText: string;
  linkAddress: string;
  datePublished: ReactNode;
  _id?: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  imageAlt?: string;
  author?: string;
  date: Date;
  featured?: boolean;
  slug: string;
  tags?: string[];
  category: string;
}

interface PlayerEloStats {
  elo: number;
  wins: number;
  losses: number;
  lastMatchDate?: Date;
}

export interface Player {
  elo: ReactNode;
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  joinedAt: string | Date;
  discordProfilePicture?: string;
  team?: number;
  stats?: {
    elo?: number;
    wins?: number;
    losses?: number;
    ratio?: number;
  };
  eloStats: {
    "2v2": PlayerEloStats;
    "4v4": PlayerEloStats;
    "5v5": PlayerEloStats;
  };
}

export interface Video {
  src: string | undefined;
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: Date;
  duration?: string;
  tags?: string[];
  category: string;
}

export interface Match {
  matchId: string;
  title: string | ReactNode;
  players: MatchPlayer[];
  teamSize: number;
  gameType: string;
  status: string;
  eloTier: string;
  winner?: string;
  createdTS: number;
  maps: string[];
  results: MapResult[];
}

export interface MapResult {
  map: string;
  winner: string;
  timestamp: Date;
  scores: {
    team1: number;
    team2: number;
  };
  scoredBy: string;
}

export interface Queue {
  _id: string;
  teamSize: number;
  players: Player[];
  queueId: string;
  gameType: string;
  eloTier?: string;
}

export interface MatchPlayer extends Player {
  isReady?: boolean;
  team?: TeamNumber;
}
