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

export async function createModerationLog(data: ModerationLogData) {
  const { db } = await connectToDatabase();

  // Safely convert string IDs to ObjectIds for MongoDB
  const logData = {
    ...data,
    // Only convert to ObjectId if the ID is a valid 24-character hex string
    playerId: isValidObjectId(data.playerId)
      ? new ObjectId(data.playerId)
      : data.playerId,
    moderatorId: isValidObjectId(data.moderatorId)
      ? new ObjectId(data.moderatorId)
      : data.moderatorId,
    // Only attempt to convert ruleId if it's not null and is a valid ObjectId
    ruleId:
      data.ruleId && isValidObjectId(data.ruleId)
        ? new ObjectId(data.ruleId)
        : data.ruleId,
  };

  await db.collection("moderation_logs").insertOne(logData);
}

// Helper function to check if a string is a valid MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}
