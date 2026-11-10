/**
 * Live permission check for creating and managing site content (event and news
 * posts, FAQs, home broadcast).
 *
 * Session roles are read from Discord only at sign-in and last up to 30 days, so
 * a demoted admin would keep access. Content writes instead ask Discord for the
 * member's current roles, using the bot token (the same one /api/user/data uses).
 */

import { canManageContent, hasAdminRole, SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";

const ROLE_CACHE_TTL_MS = 60 * 1000;
const DISCORD_REQUEST_TIMEOUT_MS = 5000;
const MAX_CACHED_MEMBERS = 200;

const roleCache = new Map<string, { roles: string[]; expiresAt: number }>();

/**
 * Current guild role IDs for a member. An empty list means they are not in the
 * server. Returns null when Discord cannot be reached or is not configured.
 */
async function getLiveGuildRoles(userId: string): Promise<string[] | null> {
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.roles;

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!botToken || !guildId) {
    safeLog.error("Content permission check needs DISCORD_BOT_TOKEN and DISCORD_GUILD_ID");
    return null;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${sanitizeString(guildId, 50)}/members/${sanitizeString(userId, 50)}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        signal: AbortSignal.timeout(DISCORD_REQUEST_TIMEOUT_MS),
        cache: "no-store",
      }
    );

    // 404 means the user left or was removed from the server.
    let roles: string[];
    if (response.status === 404) {
      roles = [];
    } else if (response.ok) {
      const member = (await response.json()) as { roles?: unknown };
      roles = Array.isArray(member.roles)
        ? member.roles.filter((role): role is string => typeof role === "string")
        : [];
    } else {
      safeLog.error(`Discord role check failed with status ${response.status}`);
      return null;
    }

    if (roleCache.size >= MAX_CACHED_MEMBERS) roleCache.clear();
    roleCache.set(userId, { roles, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
    return roles;
  } catch (error) {
    safeLog.error("Discord role check error:", error);
    return null;
  }
}

/**
 * True for the developer ID, or for a member who currently holds the Admin or
 * Founder role. If Discord cannot confirm the roles, access is denied.
 */
export async function canManageContentLive(
  user: { id?: string | null; roles?: string[] } | null | undefined
): Promise<boolean> {
  if (!user?.id) return false;
  if (user.id === SECURITY_CONFIG.DEVELOPER_ID) return canManageContent(user);

  const liveRoles = await getLiveGuildRoles(user.id);
  return liveRoles !== null && hasAdminRole(liveRoles);
}
