import { ObjectId } from "mongodb";

interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  role: "captain" | "member" | "substitute";
  elo: {
    [key: string]: string;
  };
  joinedAt: Date | string;
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
