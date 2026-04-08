import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { getDiscordUserInfoBatch } from "@/lib/discord-user-info";
import {
  banLogIsStillActive,
  buildLatestUnbanTimestampByPlayerId,
} from "@/lib/compute-moderation-stats";

type RawLog = Record<string, unknown> & {
  _id?: ObjectId;
  playerId?: string;
  /** When present on legacy or manual rows, used to resolve Discord + avatar */
  playerDiscordId?: string;
  moderatorId?: string;
  action?: string;
  timestamp?: Date;
  expiry?: Date | string | null;
};

/**
 * Enrich moderation log documents with Discord + player avatars (admin panel).
 * When `allBanUnbanForActiveLookup` is provided, sets `banIsActive` on ban rows.
 */
export async function enrichAdminModerationLogs(
  db: Db,
  logs: RawLog[],
  allBanUnbanForActiveLookup?: RawLog[],
): Promise<Record<string, unknown>[]> {
  const unbanMap = allBanUnbanForActiveLookup
    ? buildLatestUnbanTimestampByPlayerId(allBanUnbanForActiveLookup)
    : null;

  const discordIdsToResolve = new Set<string>();

  const playerIds = new Set<string>();
  for (const log of logs) {
    if (log.moderatorId) {
      discordIdsToResolve.add(log.moderatorId);
    }
    if (log.playerId) {
      playerIds.add(log.playerId);
    }
    const embedded = log.playerDiscordId;
    if (typeof embedded === "string" && embedded.trim()) {
      discordIdsToResolve.add(embedded.trim());
    }
  }

  const validPlayerObjectIds = Array.from(playerIds)
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const players = await db
    .collection("Players")
    .find({
      $or: [
        { _id: { $in: validPlayerObjectIds } },
        { discordId: { $in: Array.from(playerIds) } },
      ],
    })
    .toArray();

  for (const player of players) {
    const discordId = player.discordId as string | undefined;
    if (discordId) {
      discordIdsToResolve.add(discordId);
    }
  }

  for (const id of Array.from(playerIds)) {
    if (!ObjectId.isValid(id)) {
      discordIdsToResolve.add(id);
    }
  }

  const discordUserInfoMap = await getDiscordUserInfoBatch(
    Array.from(discordIdsToResolve),
  );

  const playerIdToDiscordId = new Map<string, string>();
  for (const player of players) {
    const id = player._id;
    const discordId = player.discordId as string | undefined;
    if (id && discordId) {
      playerIdToDiscordId.set(id.toString(), discordId);
    }
  }

  const playerAvatarByDiscordId = new Map<string, string | null>();
  for (const player of players) {
    const doc = player as {
      discordId?: string;
      discordProfilePicture?: string | null;
    };
    if (doc.discordId && doc.discordProfilePicture) {
      playerAvatarByDiscordId.set(doc.discordId, doc.discordProfilePicture);
    }
  }

  return logs.map((log) => {
    const embeddedDiscord =
      typeof log.playerDiscordId === "string" && log.playerDiscordId.trim()
        ? log.playerDiscordId.trim()
        : "";

    let playerDiscordId: string | null = null;
    if (embeddedDiscord) {
      playerDiscordId = embeddedDiscord;
    } else if (log.playerId) {
      if (!ObjectId.isValid(log.playerId)) {
        playerDiscordId = log.playerId;
      } else {
        playerDiscordId = playerIdToDiscordId.get(log.playerId) || null;
      }
    }

    const playerInfo = playerDiscordId
      ? discordUserInfoMap.get(playerDiscordId)
      : null;
    const moderatorInfo = log.moderatorId
      ? discordUserInfoMap.get(log.moderatorId)
      : null;

    const storedPlayerAvatar = playerDiscordId
      ? playerAvatarByDiscordId.get(playerDiscordId)
      : undefined;

    const banIsActive =
      log.action === "ban" && unbanMap
        ? banLogIsStillActive(
            {
              action: log.action,
              playerId: log.playerId,
              timestamp: log.timestamp,
              expiry: log.expiry,
            },
            unbanMap,
          )
        : undefined;

    return {
      ...log,
      _id: log._id?.toString?.() ?? log._id,
      playerName: playerInfo
        ? playerInfo.nickname || playerInfo.username
        : log.playerName,
      playerNickname: playerInfo?.nickname,
      playerProfilePicture:
        playerInfo?.profilePicture ??
        storedPlayerAvatar ??
        (log as { playerProfilePicture?: string | null }).playerProfilePicture ??
        null,
      playerDiscordId,
      moderatorName: moderatorInfo
        ? moderatorInfo.nickname || moderatorInfo.username
        : log.moderatorName,
      moderatorNickname: moderatorInfo?.nickname,
      moderatorProfilePicture: moderatorInfo?.profilePicture || null,
      moderatorDiscordId: log.moderatorId,
      ...(banIsActive !== undefined ? { banIsActive } : {}),
    };
  });
}
