import type { Filter } from "mongodb";
import { ObjectId } from "mongodb";

type PlayerLookup = { _id?: ObjectId; discordId?: string };

/**
 * Match `Players` by route `[id]`: 24-char hex Mongo `_id`, or numeric Discord snowflake (`discordId`).
 */
export function playersRouteIdFilter(sanitizedId: string): Filter<PlayerLookup> | null {
  const id = sanitizedId.trim();
  if (!id) return null;
  if (/^[a-fA-F0-9]{24}$/.test(id)) {
    return { _id: new ObjectId(id) };
  }
  if (/^\d{10,32}$/.test(id)) {
    return { discordId: id };
  }
  return null;
}
