import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Centralized function to check if a player is banned
export async function isPlayerBanned(discordId: string): Promise<{
  isBanned: boolean;
  message?: string;
  banExpiry?: Date | null;
}> {
  try {
    const { db } = await connectToDatabase();

    console.log(`[BAN-CHECK] Checking ban status for discordId: ${discordId}`);

    const player = await db.collection("Players").findOne({ discordId });

    if (!player) {
      console.log(`[BAN-CHECK] Player not found: ${discordId}`);
      return { isBanned: false };
    }

    // Debug log
    console.log(`[BAN-CHECK] Player record:`, {
      id: player._id,
      discordId: player.discordId,
      isBanned: player.isBanned,
      banExpiry: player.banExpiry,
      typeof_isBanned: typeof player.isBanned,
    });

    // Extra check for type issues - force to boolean if it's a string
    let isBanned = false;
    if (typeof player.isBanned === "string") {
      isBanned = player.isBanned === "true";
    } else {
      isBanned = !!player.isBanned;
    }

    // Check if ban has expired
    if (
      isBanned &&
      player.banExpiry &&
      new Date(player.banExpiry) < new Date()
    ) {
      console.log(`[BAN-CHECK] Expired ban found, removing ban`);

      // Update the player record to remove expired ban
      await db
        .collection("Players")
        .updateOne(
          { _id: player._id },
          { $set: { isBanned: false, banExpiry: null } }
        );

      return { isBanned: false };
    }

    // Active ban found
    if (isBanned) {
      const message = player.banExpiry
        ? `Your account is banned until ${new Date(
            player.banExpiry
          ).toLocaleString()}.`
        : "Your account is permanently banned from matchmaking.";

      console.log(`[BAN-CHECK] Active ban confirmed: ${discordId}`);
      return {
        isBanned: true,
        message,
        banExpiry: player.banExpiry,
      };
    }

    return { isBanned: false };
  } catch (error) {
    console.error("[BAN-CHECK] Error checking ban status:", error);
    // In case of error, default to not banned
    return { isBanned: false };
  }
}
