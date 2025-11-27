import clientPromise from "./mongodb";

interface DiscordUserInfo {
  nickname: string;
  username: string;
  profilePicture: string | null;
}

/**
 * Fetches current Discord user information (nickname, username, profile picture)
 * First tries to get from Players collection, then falls back to Discord API if needed
 */
export async function getDiscordUserInfo(
  discordId: string
): Promise<DiscordUserInfo | null> {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // First, try to get from Players collection (most up-to-date)
    const player = await db.collection("Players").findOne({
      discordId: discordId,
    });

    if (player) {
      return {
        nickname: player.discordNickname || player.discordUsername || "",
        username: player.discordUsername || "",
        profilePicture: player.discordProfilePicture || null,
      };
    }

    // If not found in Players collection, try Discord API
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (botToken && guildId) {
      try {
        // Fetch from Discord API
        const discordResponse = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
          {
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (discordResponse.ok) {
          const memberData = await discordResponse.json();
          const user = memberData.user;

          return {
            nickname: memberData.nick || user.global_name || user.username || "",
            username: user.username || "",
            profilePicture: user.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
              : null,
          };
        }
      } catch (error) {
        console.error(`Error fetching Discord user info for ${discordId}:`, error);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting Discord user info for ${discordId}:`, error);
    return null;
  }
}

/**
 * Batch fetch Discord user info for multiple users
 */
export async function getDiscordUserInfoBatch(
  discordIds: string[]
): Promise<Map<string, DiscordUserInfo>> {
  const result = new Map<string, DiscordUserInfo>();

  // Fetch all in parallel
  const promises = discordIds.map(async (id) => {
    const info = await getDiscordUserInfo(id);
    if (info) {
      result.set(id, info);
    }
  });

  await Promise.all(promises);

  return result;
}

