import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import {
  findTeamAcrossCollections,
  getAllTeamCollectionNames,
} from "@/lib/team-collections";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import {
  getStoredDiscordProfilePicture,
  resolveDiscordAvatarUrl,
} from "@/lib/discord-default-avatar";

export const dynamic = "force-dynamic";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getEloForTeamSize(player: Record<string, unknown>, teamSize: number): number {
  const stats = player.stats as
    | Array<{ teamSize?: number; elo?: number }>
    | undefined;
  if (Array.isArray(stats)) {
    const row = stats.find((s) => s.teamSize === teamSize);
    if (row?.elo != null) return Number(row.elo);
  }
  const teamStat = player.teamStat as
    | { teamSize?: number; elo?: number }
    | undefined;
  if (teamStat?.teamSize === teamSize && teamStat.elo != null) {
    return Number(teamStat.elo);
  }
  const eloRecord = player.elo as Record<string, number> | undefined;
  if (eloRecord && typeof eloRecord === "object") {
    const v = eloRecord[String(teamSize)];
    if (typeof v === "number") return v;
  }
  return 0;
}

async function getSearchHandler(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawQuery = searchParams.get("q") ?? searchParams.get("term");
  const query = rawQuery?.trim() ?? "";
  const includeTeamInfo = searchParams.get("includeTeamInfo") === "true";
  const forTeamId = searchParams.get("forTeamId");

  if (!query || query.length < 2) {
    return NextResponse.json({ players: [] });
  }

  const { db } = await connectToDatabase();

  let targetTeam: { _id: ObjectId; teamSize?: number; name?: string } | null =
    null;
  if (forTeamId && ObjectId.isValid(forTeamId)) {
    const found = await findTeamAcrossCollections(db, forTeamId);
    if (found) {
      targetTeam = found.team;
    }
  }

  try {
    const escaped = escapeRegExp(query);
    const players = await db
      .collection("Players")
      .find({
        $or: [
          { discordId: query },
          { discordNickname: { $regex: escaped, $options: "i" } },
          { discordUsername: { $regex: escaped, $options: "i" } },
        ],
      })
      .limit(10)
      .toArray();

    const discordIds = players.map((p) => p.discordId as string);

    let pendingInviteIds = new Set<string>();
    if (
      includeTeamInfo &&
      targetTeam &&
      forTeamId &&
      ObjectId.isValid(forTeamId) &&
      discordIds.length > 0
    ) {
      const pending = await db
        .collection("TeamInvites")
        .find({
          teamId: new ObjectId(forTeamId),
          inviteeId: { $in: discordIds },
          status: "pending",
        })
        .project({ inviteeId: 1 })
        .toArray();
      pendingInviteIds = new Set(
        pending.map((doc) => doc.inviteeId as string)
      );
    }

    /** discordId -> teams they're a member of */
    const teamsByPlayer = new Map<
      string,
      Array<{ _id: ObjectId; name: string; teamSize: number }>
    >();

    if (includeTeamInfo && discordIds.length > 0) {
      for (const collectionName of getAllTeamCollectionNames()) {
        const teamDocs = await db
          .collection(collectionName)
          .find({
            "members.discordId": { $in: discordIds },
          })
          .project({ _id: 1, name: 1, teamSize: 1, members: 1 })
          .toArray();

        for (const team of teamDocs) {
          const members = team.members as { discordId: string }[] | undefined;
          if (!Array.isArray(members)) continue;
          const teamSize = Number(team.teamSize ?? 4);
          const name = String(team.name ?? "");
          const id = team._id as ObjectId;
          for (const m of members) {
            if (!discordIds.includes(m.discordId)) continue;
            const list = teamsByPlayer.get(m.discordId) ?? [];
            if (!list.some((t) => t._id.toString() === id.toString())) {
              list.push({ _id: id, name, teamSize });
            }
            teamsByPlayer.set(m.discordId, list);
          }
        }
      }
    }

    const targetTeamSize = targetTeam
      ? Number(targetTeam.teamSize ?? 4)
      : 4;

    const results = players.map((player) => {
      const playerDoc = player as Record<string, unknown>;
      const discordId = player.discordId as string;
      const discordNickname = (player.discordNickname as string) || "";
      const discordUsername = (player.discordUsername as string) || "";
      const name =
        discordNickname.trim() ||
        discordUsername ||
        discordId;
      const username = discordUsername;

      const playerTeams = teamsByPlayer.get(discordId) ?? [];
      const targetIdStr = targetTeam?._id?.toString();

      const isMemberOfTargetTeam =
        !!targetIdStr &&
        playerTeams.some((t) => t._id.toString() === targetIdStr);

      const otherSameSizeTeam = playerTeams.find(
        (t) =>
          t.teamSize === targetTeamSize &&
          (!targetIdStr || t._id.toString() !== targetIdStr)
      );

      const inTeamOfSameSize = !!otherSameSizeTeam;

      const primaryTeamForUi =
        otherSameSizeTeam ??
        playerTeams.find((t) => t.teamSize === targetTeamSize) ??
        playerTeams[0] ??
        null;

      const elo = getEloForTeamSize(playerDoc, targetTeamSize);

      const storedAvatarUrl = getStoredDiscordProfilePicture(playerDoc);

      return {
        id: discordId,
        name,
        username,
        elo,
        discordId,
        discordNickname,
        discordUsername,
        /** Raw value from `Players.discordProfilePicture` for clients that load avatars in order */
        discordProfilePicture: storedAvatarUrl,
        /** Backward-compatible single URL: stored first, else default embed */
        profilePicture: resolveDiscordAvatarUrl(discordId, playerDoc),
        isInvited: pendingInviteIds.has(discordId),
        isMemberOfTargetTeam,
        inTeam: playerTeams.length > 0,
        inTeamOfSameSize,
        team: primaryTeamForUi
          ? {
              id: primaryTeamForUi._id.toString(),
              name: primaryTeamForUi.name,
              teamSize: primaryTeamForUi.teamSize,
            }
          : null,
        teamName: primaryTeamForUi?.name,
        teamSize: primaryTeamForUi?.teamSize,
      };
    });

    const res = NextResponse.json({ players: results });
    res.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return res;
  } catch (error) {
    safeLog.error("Error searching players", { error });
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
}

export const GET = withApiSecurity(getSearchHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
