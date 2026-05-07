import clientPromise from "./mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog } from "@/lib/security";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Discord returns 429 with Retry-After header or JSON { retry_after } (seconds).
 * Retries a few times to absorb bursts (e.g. duplicate callbacks hitting /guilds).
 */
async function discordFetchWithRetry(
  url: string,
  init: RequestInit,
  maxAttempts = 4
): Promise<Response> {
  let lastResponse: Response | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, init);
    lastResponse = response;

    if (response.status !== 429 || attempt === maxAttempts) {
      return response;
    }

    let waitMs = 800 * attempt;
    const retryAfterHeader = response.headers.get("retry-after");
    if (retryAfterHeader) {
      waitMs = Math.ceil(parseFloat(retryAfterHeader) * 1000);
    } else {
      try {
        const body = (await response.clone().json()) as {
          retry_after?: number;
        };
        if (typeof body.retry_after === "number") {
          waitMs = Math.ceil(body.retry_after * 1000);
        }
      } catch {
        // keep backoff default
      }
    }

    waitMs = Math.min(Math.max(waitMs, 100), 10_000);
    await sleep(waitMs);
  }

  return lastResponse!;
}

export async function getGuildData(accessToken: string) {
  try {
    // Get the guild ID from environment variables
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!guildId) {
      safeLog.error("DISCORD_GUILD_ID is not defined in environment variables");
      return null;
    }

    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };

    // First verify the access token is valid
    const userResponse = await discordFetchWithRetry(
      "https://discord.com/api/users/@me",
      {
        headers: authHeaders,
      }
    );

    if (!userResponse.ok) {
      safeLog.error("Invalid Discord access token:", await userResponse.text());
      return null;
    }

    void (await userResponse.json());

    // Now check if user is in the guild with the provided token
    const guildsResponse = await discordFetchWithRetry(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: authHeaders,
      }
    );

    if (!guildsResponse.ok) {
      safeLog.error(
        "Failed to fetch user guilds:",
        await guildsResponse.text()
      );
      return null;
    }

    const guilds = await guildsResponse.json();

    const isInGuild = guilds.some(
      (guild: { id: string }) => guild.id === guildId
    );

    if (!isInGuild) {
      return null;
    }

    // Direct endpoint for guild member data with proper authorization
    const response = await discordFetchWithRetry(
      `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
      {
        headers: authHeaders,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      safeLog.error(
        `Failed to fetch guild member data (status ${response.status}):`,
        errorText
      );

      // If we get a 401/403, we may need the guild.members.read scope
      if (response.status === 401 || response.status === 403) {
        safeLog.error(
          "This might be a permissions issue. Check that your Discord app has the guilds.members.read scope."
        );
      }

      return null;
    }

    const data = await response.json();

    // Check different possible field names for the nickname
    const guildNickname =
      data.nick || data.guildNickname || data.user?.nick || null;

    return {
      nick: guildNickname,
      roles: data.roles || [],
      joinedAt: data.joined_at || null,
      // Include the raw data for debugging
      rawData: data,
    };
  } catch (error) {
    safeLog.error("Error fetching guild data:", error);
    return null;
  }
}

export async function getUserData(accessToken: string | undefined) {
  try {
    if (accessToken === undefined) {
      throw new Error("No access token provided");
    }
    const response = await fetch("https://discord.com/api/users/@me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-cache",
    });

    if (!response.ok) throw new Error("Failed to fetch user data");
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

// Helper function to extract the correct nickname to use
export async function getPlayerNickname(accessToken: string | undefined) {
  try {
    // Get guild-specific data first
    if (!accessToken) {
      return null;
    }

    const guildData = await getGuildData(accessToken);

    // If guild data includes a nickname, use that (this is the guild-specific nickname)
    if (guildData && guildData.nick) {
      return guildData.nick;
    }

    // If no guild nickname, fall back to user's global username
    const userData = await getUserData(accessToken);
    if (userData) {
      return userData.username;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function upsertPlayerDiscordData(
  discordId: string,
  discordUsername: string, // Global username
  discordProfilePicture: string
) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get user's guild data to extract the guild nickname
    // This will need to be updated to use a passed token
    // or we could implement this differently based on your auth flow

    // For now, we'll update without the guild nickname
    // and update separately when we have the token
    const result = await db.collection("Players").updateOne(
      { discordId },
      {
        $set: {
          discordId,
          discordUsername,
          discordProfilePicture,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          stats: [],
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    return result;
  } catch (error) {
    return null;
  }
}

// New function that updates player with guild-specific nickname
export async function updatePlayerGuildNickname(
  discordId: string,
  guildNickname: string
) {
  try {
    // Don't update if the nickname is null or empty
    if (!guildNickname || guildNickname.trim() === "") {
      return null;
    }

    const { db } = await connectToDatabase();

    // Update the player document
    const result = await db.collection("Players").updateOne(
      { discordId },
      {
        $set: {
          discordNickname: guildNickname,
          updatedAt: new Date(),
        },
      }
    );

    // Update all team references where this player is a member
    await db.collection("Teams").updateMany(
      { "members.discordId": discordId },
      {
        $set: {
          "members.$[member].discordNickname": guildNickname,
          updatedAt: new Date(),
        },
      },
      {
        arrayFilters: [{ "member.discordId": discordId }],
      }
    );

    // Update team captain info if the player is a team captain
    await db.collection("Teams").updateMany(
      { "captain.discordId": discordId },
      {
        $set: {
          "captain.discordNickname": guildNickname,
          updatedAt: new Date(),
        },
      }
    );

    return result;
  } catch (error) {
    safeLog.error("Error updating player guild nickname:", error);
    throw error;
  }
}

/**
 * Formats a Discord avatar URL properly for social cards
 * @param userId Discord user ID
 * @param avatar Avatar hash or full URL
 * @returns Properly formatted Discord avatar URL or null if invalid
 */
export function formatDiscordAvatarUrl(
  userId: string,
  avatar: string | null
): string | null {
  if (!avatar || !userId) return null;

  // If it's already a full URL, return it
  if (avatar.startsWith("http")) {
    return avatar;
  }

  // Handle animated avatars (GIF) vs static ones (PNG)
  const format = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${format}`;
}

/**
 * Gets the best available avatar URL for a player, with fallbacks
 * @param player Player object from database
 * @param baseUrl Base URL for fallback images
 * @returns URL for player avatar or fallback
 */
export function getPlayerAvatarUrl(player: any, baseUrl: string): string {
  // Try Discord profile picture first
  if (player.discordProfilePicture) {
    const formattedUrl = formatDiscordAvatarUrl(
      player.discordId,
      player.discordProfilePicture
    );
    if (formattedUrl) return formattedUrl;
  }

  // Try discord avatar field as backup
  if (player.discordAvatar && player.discordId) {
    const formattedUrl = formatDiscordAvatarUrl(
      player.discordId,
      player.discordAvatar
    );
    if (formattedUrl) return formattedUrl;
  }

  // Fallback to default image
  return `${baseUrl}/hero.webp`;
}
