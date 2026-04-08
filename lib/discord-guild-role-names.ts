import type { Db } from "mongodb";
import { safeLog } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Fetches guild roles from Discord and returns id → name (excludes @everyone).
 * Used to label queue role whitelists without exposing the full roles API to clients.
 */
export async function fetchGuildRoleNameById(db: Db): Promise<Map<string, string>> {
  const empty = new Map<string, string>();
  if (!process.env.DISCORD_BOT_TOKEN) {
    return empty;
  }

  try {
    const guild = await db.collection("Guilds").findOne({});
    const guildIdRaw = guild?.guildId;
    const guildId =
      typeof guildIdRaw === "string"
        ? guildIdRaw.trim()
        : guildIdRaw != null
          ? String(guildIdRaw).trim()
          : "";
    if (!guildId) {
      return empty;
    }

    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      safeLog.error(
        "Discord guild roles fetch failed:",
        response.status,
        await response.text()
      );
      return empty;
    }

    const roles = (await response.json()) as Array<{ id: string; name: string }>;
    const map = new Map<string, string>();
    for (const role of roles) {
      if (role?.id && role?.name && role.name !== "@everyone") {
        map.set(String(role.id).trim(), role.name);
      }
    }
    return map;
  } catch (error) {
    safeLog.error("fetchGuildRoleNameById:", error);
    return empty;
  }
}

/** Cached guild role map (5 min) — limits Discord API use across queue reads. */
export async function getCachedGuildRoleNameById(
  db: Db
): Promise<Map<string, string>> {
  return cachedQuery(
    "discord:guild-role-name-map",
    () => fetchGuildRoleNameById(db),
    5 * 60 * 1000
  );
}
