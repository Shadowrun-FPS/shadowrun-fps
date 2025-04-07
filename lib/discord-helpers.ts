import clientPromise from "./mongodb";
import { connectToDatabase } from "@/lib/mongodb";

export async function getGuildData(accessToken: string) {
  try {
    // Get the guild ID from environment variables
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!guildId) {
      console.error("DISCORD_GUILD_ID is not defined in environment variables");
      return null;
    }

    // First verify the access token is valid
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Invalid Discord access token:", await userResponse.text());
      return null;
    }

    const userData = await userResponse.json();

    // Now check if user is in the guild with the provided token
    const guildsResponse = await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!guildsResponse.ok) {
      console.error(
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
      console.log(`User ${userData.id} is not a member of guild ${guildId}`);
      return null;
    }

    // Direct endpoint for guild member data with proper authorization
    const response = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch guild member data (status ${response.status}):`,
        errorText
      );

      // If we get a 401/403, we may need the guild.members.read scope
      if (response.status === 401 || response.status === 403) {
        console.error(
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
    console.error("Error fetching guild data:", error);
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
    console.log(error);
    return null;
  }
}

// Helper function to extract the correct nickname to use
export async function getPlayerNickname(accessToken: string | undefined) {
  try {
    // Get guild-specific data first
    if (!accessToken) {
      console.log("No access token provided to getPlayerNickname");
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
    console.log("Error getting player nickname:", error);
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
    console.log(error);
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
      console.error(`Cannot update player ${discordId} with empty nickname`);
      return null;
    }

    console.log(
      `Updating player ${discordId} with guild nickname: "${guildNickname}"`
    );

    const { db } = await connectToDatabase();

    // First check if the player exists and what their current nickname is
    const existingPlayer = await db
      .collection("Players")
      .findOne({ discordId });

    if (existingPlayer) {
      console.log(
        `Current nickname for ${discordId}: "${
          existingPlayer.discordNickname || "null"
        }"`
      );
    } else {
      console.log(`Player ${discordId} not found in database`);
    }

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

    console.log(`Update result for ${discordId}:`, {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

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
    console.error("Error updating player guild nickname:", error);
    throw error;
  }
}
