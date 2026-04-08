import type { Db } from "mongodb";
import type { Document } from "mongodb";
import { getCachedGuildRoleNameById } from "@/lib/discord-guild-role-names";
import {
  looksLikeDiscordSnowflakeId,
  normalizeDiscordSnowflakeList,
} from "@/lib/normalize-discord-snowflake";

/**
 * Adds `requiredRoleNames` on each queue document (Discord map + DB fallback).
 * Used by GET /api/queues, SSE /api/queues/events, and anywhere else that ships
 * queue lists to the client so role gates stay consistent.
 */
export async function enrichQueueDocumentsWithRoleNames<T extends Document>(
  queues: T[],
  db: Db
): Promise<T[]> {
  const roleNameById = await getCachedGuildRoleNameById(db);
  return queues.map((q) => {
    const raw = (q as unknown as { requiredRoles?: unknown }).requiredRoles;
    const ids = normalizeDiscordSnowflakeList(raw);
    if (ids.length === 0) {
      return q;
    }

    const doc = q as unknown as {
      requiredRoleNames?: unknown;
    };
    const storedArr = Array.isArray(doc.requiredRoleNames)
      ? doc.requiredRoleNames
      : [];

    const requiredRoleNames = ids.map((rid, i) => {
      const fromDiscord = roleNameById.get(rid);
      if (fromDiscord) {
        return fromDiscord;
      }
      const fromDb =
        typeof storedArr[i] === "string" ? storedArr[i] : undefined;
      if (
        fromDb != null &&
        fromDb !== rid &&
        !looksLikeDiscordSnowflakeId(fromDb)
      ) {
        return fromDb;
      }
      return rid;
    });

    return { ...q, requiredRoleNames } as T;
  });
}
