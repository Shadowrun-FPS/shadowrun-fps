import clientPromise from "./mongodb";
import { safeLog } from "@/lib/security";

interface DiscordUserInfo {
  nickname: string;
  username: string;
  profilePicture: string | null;
}

/**
 * Guild member payload from Discord REST (subset).
 */
async function fetchGuildMemberFromDiscordApi(
  discordId: string,
): Promise<DiscordUserInfo | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    return null;
  }

  try {
    const discordResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!discordResponse.ok) {
      return null;
    }

    const memberData = (await discordResponse.json()) as {
      nick?: string | null;
      user?: {
        id: string;
        username?: string;
        global_name?: string | null;
        avatar?: string | null;
      };
    };
    const user = memberData.user;
    if (!user) {
      return null;
    }

    return {
      nickname:
        memberData.nick || user.global_name || user.username || "",
      username: user.username || "",
      profilePicture: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
        : null,
    };
  } catch (error) {
    safeLog.error("Discord guild member fetch failed", { discordId, error });
    return null;
  }
}

/**
 * Fetches current Discord user information (nickname, username, profile picture).
 * Uses the Players collection first; if the player exists but has no cached avatar,
 * falls back to the Discord API so moderation UIs still show avatars.
 */
export async function getDiscordUserInfo(
  discordId: string,
): Promise<DiscordUserInfo | null> {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const player = await db.collection("Players").findOne({
      discordId: discordId,
    });

    if (player) {
      const doc = player as {
        discordNickname?: string | null;
        discordUsername?: string | null;
        discordProfilePicture?: string | null;
      };
      const nickname = doc.discordNickname || doc.discordUsername || "";
      const username = doc.discordUsername || "";
      let profilePicture = doc.discordProfilePicture || null;

      if (!profilePicture) {
        const fromApi = await fetchGuildMemberFromDiscordApi(discordId);
        if (fromApi?.profilePicture) {
          profilePicture = fromApi.profilePicture;
        }
      }

      return {
        nickname,
        username,
        profilePicture,
      };
    }

    const fromApi = await fetchGuildMemberFromDiscordApi(discordId);
    if (fromApi) {
      return fromApi;
    }

    return null;
  } catch (error) {
    safeLog.error("Error getting Discord user info", { discordId, error });
    return null;
  }
}

/**
 * Batch fetch Discord user info for multiple users
 */
export async function getDiscordUserInfoBatch(
  discordIds: string[],
): Promise<Map<string, DiscordUserInfo>> {
  const result = new Map<string, DiscordUserInfo>();

  const promises = discordIds.map(async (id) => {
    const info = await getDiscordUserInfo(id);
    if (info) {
      result.set(id, info);
    }
  });

  await Promise.all(promises);

  return result;
}
