import mongoose, { Schema, Document } from "mongoose";
import { ObjectId } from "mongodb";

export interface IScrimmage extends Document {
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

const ScrimmageSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
    },
    challengerTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    challengedTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    challengerTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    challengedTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    challengerCaptain: {
      discordId: String,
      discordUsername: String,
      discordNickname: String,
      discordProfilePicture: String,
    },
    proposedDate: {
      type: String,
      required: true,
    },
    selectedMaps: [
      {
        id: String,
        name: String,
        isSmallVariant: Boolean,
        image: String,
      },
    ],
    message: String,
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
        "forfeited",
      ],
      default: "pending",
    },
    createdAt: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: String,
      required: true,
    },
    notifiedAt: String,
    scrimmageId: String,
    mapScores: [
      {
        teamAScore: Number,
        teamBScore: Number,
        winner: String,
        teamASubmitted: Boolean,
        teamBSubmitted: Boolean,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Scrimmage ||
  mongoose.model<IScrimmage>("Scrimmage", ScrimmageSchema);
