import { ObjectId } from "mongodb";
import type { Team } from "@/types";
import { connectToDatabase } from "@/lib/mongodb";
import { getMemberElosForTeamSize, recalculateTeamElo } from "@/lib/team-elo-calculator";
import { getAllTeamCollectionNames } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";

type TeamEnrich = {
  teamSize?: number;
  members?: { discordId: string; role?: string; joinedAt?: string }[];
  captain?: { discordId: string; joinedAt?: string };
  [key: string]: unknown;
};

/**
 * Resolve a team by Mongo ObjectId or tag, with the same payload shape as GET /api/teams/[teamId].
 * Used by Server Components to avoid HTTP self-fetch (fragile on Vercel: URL env, rate limits, etc.).
 */
export async function getPublicTeamByIdOrTag(rawTeamId: string): Promise<Team | null> {
  const teamId = sanitizeString(rawTeamId, 50);
  if (!teamId) return null;

  const { db } = await connectToDatabase();

  const result = await cachedQuery(
    `team:${teamId}`,
    async () => {
      const allCollections = getAllTeamCollectionNames();
      let team = null;

      if (ObjectId.isValid(teamId)) {
        for (const collectionName of allCollections) {
          try {
            team = await db
              .collection(collectionName)
              .findOne({ _id: new ObjectId(teamId) });
            if (team) break;
          } catch {
            // Continue to next collection
          }
        }
      }

      if (!team) {
        for (const collectionName of allCollections) {
          team = await db.collection(collectionName).findOne({ tag: teamId });
          if (team) break;
        }
      }

      if (!team) {
        return null;
      }

      if (team.members && team.members.length > 0) {
        try {
          const updatedElo = await recalculateTeamElo(team._id.toString());
          team.teamElo = updatedElo;
        } catch (error) {
          safeLog.error("Failed to auto-calculate team ELO:", error);
        }
      }

      return {
        ...team,
        _id: team._id.toString(),
      };
    },
    60 * 1000
  );

  if (!result) return null;

  const team = result as TeamEnrich;
  const teamSize = team.teamSize ?? 4;
  const memberIds: string[] = Array.from(
    new Set(
      [
        ...(team.members?.map((m) => m.discordId) ?? []),
        team.captain?.discordId,
      ].filter((id): id is string => Boolean(id))
    )
  );
  const captainMember = team.members?.find(
    (m) =>
      m.discordId === team.captain?.discordId ||
      (m.role?.toLowerCase() ?? "") === "captain"
  );
  let elos: Record<string, number> = {};
  if (memberIds.length > 0) {
    try {
      elos = await getMemberElosForTeamSize(memberIds, teamSize);
    } catch (err) {
      safeLog.error("Failed to resolve member ELOs for team response:", err);
    }
  }

  const serializeMember = (m: any, extra?: { joinedAt?: any; elo?: number }) => ({
    discordId: m.discordId ?? "",
    discordUsername: m.discordUsername ?? null,
    discordNickname: m.discordNickname ?? null,
    discordProfilePicture: m.discordProfilePicture ?? null,
    playerId: typeof m.playerId === "string" ? m.playerId : null,
    role: m.role ?? null,
    // Normalize Date objects to ISO strings so they pass the Server→Client boundary
    joinedAt:
      (extra?.joinedAt ?? m.joinedAt) instanceof Date
        ? (extra?.joinedAt ?? m.joinedAt).toISOString()
        : (extra?.joinedAt ?? m.joinedAt ?? null),
    elo: extra?.elo ?? (typeof m.elo === "number" ? m.elo : undefined),
  });

  const enriched = {
    _id: (result as any)._id?.toString?.() ?? String((result as any)._id),
    name: (result as any).name,
    tag: (result as any).tag,
    description: (result as any).description,
    teamElo: (result as any).teamElo,
    teamSize: (result as any).teamSize,
    wins: (result as any).wins,
    losses: (result as any).losses,
    createdAt:
      (result as any).createdAt instanceof Date
        ? (result as any).createdAt.toISOString()
        : ((result as any).createdAt ?? null),
    captain: serializeMember(team.captain ?? {}, {
      joinedAt: team.captain?.joinedAt ?? captainMember?.joinedAt,
      elo: team.captain?.discordId ? elos[team.captain.discordId] : undefined,
    }),
    members: (team.members ?? []).map((m) =>
      serializeMember(m, { elo: elos[m.discordId] })
    ),
  };

  return enriched as Team;
}
