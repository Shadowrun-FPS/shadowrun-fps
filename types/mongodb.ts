import { ObjectId } from "mongodb";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

interface TeamMember {
  discordId: string;
  discordUsername?: string;
  discordNickname: string;
  discordProfilePicture?: string;
  role: "captain" | "member" | "substitute" | string;
  elo?: Record<string, number>;
  joinedAt?: Date | string;
}

// Base interface for team data without ID
interface BaseTeam {
  name: string;
  tag: string;
  description: string;
  teamElo?: number | string;
  wins: number;
  losses: number;
  captain: {
    discordProfilePicture: string | StaticImport;
    discordId: string;
    discordUsername: string;
    discordNickname: string;
  };
  members: TeamMember[];
  lastEloUpdate?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Interface for MongoDB operations
interface MongoTeam extends BaseTeam {
  _id: ObjectId;
}

// Interface for API responses
interface TeamResponse extends BaseTeam {
  tournaments: any;
  _id: string;
}

// Interface for team stats
interface TeamWithStats extends TeamResponse {
  winRatio?: number;
}

// Base interface for invites without ID
interface BaseTeamInvite {
  teamId: ObjectId;
  inviteeId: string;
  inviteeName: string;
  inviterId: string;
  inviterName: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}

// Interface for MongoDB operations
interface TeamInvite extends BaseTeamInvite {
  _id: ObjectId;
}

// Interface for API responses
interface TeamInviteResponse extends Omit<BaseTeamInvite, "teamId"> {
  _id: string;
  teamId: string;
}

interface Player {
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

// Replace the problematic interface with this fixed version
export interface MongoDBPlayer {
  _id: ObjectId;
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  discordProfilePicture?: string;
  roles?: string[];
  // Remove string indexer and define specific properties
  elo: Record<string, number>; // Changed to Record<string, number> instead of { [key: string]: string }
  wins?: number;
  losses?: number;
  registeredAt?: Date;
  joinedAt: Date | string; // This is fine as a union type without the string indexer
  stats?: Array<{
    teamSize: number;
    elo: number;
    wins: number;
    losses: number;
    lastMatchDate: string;
  }>;
  isBanned?: boolean;
  banExpiry?: Date | null;
  // Add any other fields your model needs
}

// Add other MongoDB-related interfaces
export interface MongoDBMatch {
  _id: ObjectId;
  teamSize: number;
  teams: {
    teamA: string[]; // Array of player IDs
    teamB: string[];
  };
  scores: {
    teamA: number;
    teamB: number;
  };
  winner: "teamA" | "teamB" | "draw";
  playedAt: Date;
  map?: string;
  eloChanges?: Record<string, number>; // Player ID to ELO change
}

export interface MongoDBTeam {
  _id: ObjectId;
  name: string;
  tag: string;
  captain: string; // Player ID
  members: string[]; // Array of player IDs
  createdAt: Date;
  teamLogo?: string;
}

export interface MongoDBTournament {
  _id: ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  teamSize: number;
  maxTeams?: number;
  teams: string[]; // Array of team IDs
  status: "upcoming" | "active" | "completed";
  brackets?: any; // Define a more specific structure if needed
}

// Single export statement for all types
export type {
  TeamMember,
  MongoTeam,
  TeamResponse,
  TeamWithStats,
  TeamInvite,
  TeamInviteResponse,
  Player,
};
