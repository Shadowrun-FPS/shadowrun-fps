import { ObjectId } from "mongodb";

export interface IScrimmage {
  _id: ObjectId | string;
  challengerTeamId: ObjectId | string;
  challengedTeamId: ObjectId | string;
  challengerTeam?: Team;
  challengedTeam?: Team;
  challengerCaptain?: {
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    discordProfilePicture?: string;
  };
  proposedDate: string;
  selectedMaps: Array<{
    id: string;
    name: string;
    isSmallVariant: boolean;
    image?: string;
    gameMode: string;
  }>;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  notifiedAt?: string;
  scrimmageId?: string;
  mapScores?: Array<{
    teamAScore: number;
    teamBScore: number;
    winner?: string;
    teamASubmitted?: boolean;
    teamBSubmitted?: boolean;
  }>;
}

export interface Team {
  _id: ObjectId | string;
  name: string;
  tag: string;
  captain: {
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    discordProfilePicture?: string;
  };
  members: Array<{
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    discordProfilePicture?: string;
    role: string;
  }>;
}

