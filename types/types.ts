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

export interface Player {
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
  matchId?: string;
  teamSize: number;
  eloTier: string;
  players: Player[];
  status: string;
  createdAt: number;
  createdBy: string;
  queueId: string;
  gameType: string;
  winner?: string;
  createdTS: number;
  maps: string[];
  results: MapResult[];
}

export interface MatchPlayer extends Player {
  isReady?: boolean;
  team?: TeamNumber;
}
