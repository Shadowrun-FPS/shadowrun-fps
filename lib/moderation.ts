import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface ModerationLogData {
  playerId: string;
  moderatorId: string;
  playerName?: string;
  moderatorName?: string;
  action: string;
  reason?: string;
  ruleId?: string | null;
  duration?: string;
  expiry?: Date | null;
  timestamp: Date;
}

export async function createModerationLog(data: {
  playerId: string;
  moderatorId: string;
  playerName: string;
  moderatorName: string;
  action: string;
  reason: string;
  ruleId?: string | null;
  duration?: string;
  expiry?: Date | null;
  timestamp: Date;
}) {
  try {
    const { db } = await connectToDatabase();

    // Get the current player and moderator details
    const player = await db.collection("Players").findOne({
      _id: new ObjectId(data.playerId),
    });

    const moderator = await db.collection("Players").findOne({
      discordId: data.moderatorId,
    });

    // Create the log entry with player and moderator IDs
    // Names are still stored but will be updated in API responses
    const logEntry = {
      ...data,
      playerName:
        player?.discordNickname || player?.discordUsername || data.playerName,
      moderatorName:
        moderator?.discordNickname ||
        moderator?.discordUsername ||
        data.moderatorName,
      timestamp: data.timestamp || new Date(),
    };

    const result = await db.collection("moderation_logs").insertOne(logEntry);
    return result;
  } catch (error) {
    console.error("Error creating moderation log:", error);
    throw error;
  }
}

// Helper function to check if a string is a valid MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}
