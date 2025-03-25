import mongoose, { Schema, Document } from "mongoose";

export interface IScrimmage extends Document {
  challengerTeamId: string;
  challengedTeamId: string;
  proposedDate: Date;
  selectedMaps: string[];
  status: "pending" | "accepted" | "rejected" | "completed" | "counterProposal";
  counterProposedDate?: Date;
  winner?: string;
  mapScores?: {
    mapId: string;
    mapName: string;
    challengerScore: number;
    challengedScore: number;
    winner: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ScrimmageSchema = new Schema(
  {
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
    proposedDate: {
      type: Date,
      required: true,
    },
    selectedMaps: [
      {
        type: Schema.Types.ObjectId,
        ref: "Map",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "counterProposal"],
      default: "pending",
    },
    counterProposedDate: {
      type: Date,
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    mapScores: [
      {
        mapId: { type: Schema.Types.ObjectId, ref: "Map" },
        mapName: String,
        challengerScore: Number,
        challengedScore: Number,
        winner: { type: Schema.Types.ObjectId, ref: "Team" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Scrimmage ||
  mongoose.model<IScrimmage>("Scrimmage", ScrimmageSchema);
