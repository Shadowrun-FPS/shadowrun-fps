import { ObjectId } from "mongodb";

interface EloRatings {
  "1v1"?: number;
  "2v2"?: number;
  "4v4"?: number;
  "5v5"?: number;
}

export interface MongoPlayer {
  _id: ObjectId;
  discordId: string;
  bumjamas: string;
  discordNickname?: string;
  elo: EloRatings;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoTeam {
  _id: ObjectId;
  name: string;
  tag: string;
  description: string;
  captain: {
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    bumjamas: string;
  };
  members: Array<{
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    bumjamas: string;
    elo: EloRatings;
    role: "captain" | "member" | "substitute";
    joinedAt: Date;
  }>;
  elo: number;
  wins: number;
  losses: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  _id: ObjectId;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  gameType: "1v1" | "2v2" | "4v4" | "5v5";
  eloTier: number;
  players: Array<{
    discordId: string;
    discordNickname: string;
    team: number;
    ready: boolean;
  }>;
  team1: {
    players: Array<{
      discordId: string;
      discordNickname: string;
      elo: number;
    }>;
    averageElo: number;
  };
  team2: {
    players: Array<{
      discordId: string;
      discordNickname: string;
      elo: number;
    }>;
    averageElo: number;
  };
  maps: string[];
  scores: {
    team1: number;
    team2: number;
  };
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  readyPlayers: Record<string, boolean>;
}
