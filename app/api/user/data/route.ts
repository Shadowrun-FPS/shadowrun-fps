import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  SECURITY_CONFIG,
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
} from "@/lib/security-config";
import { withErrorHandling } from "@/lib/error-handling";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Developer ID for special permissions
const DEVELOPER_ID = SECURITY_CONFIG.DEVELOPER_ID;
const DEVELOPER_DISCORD_ID = "238329746671271936";

// Admin role IDs
const ADMIN_ROLES = ADMIN_ROLE_IDS;

// Moderator role IDs (includes admin roles)
const MOD_ROLES = MODERATOR_ROLE_IDS;

interface UserData {
  permissions: {
    isAdmin: boolean;
    isModerator: boolean;
    canCreateTournament: boolean;
    isDeveloper: boolean;
  };
  roles: string[];
  guildNickname: string | null;
  roleDisplay: Array<{
    roleId: string;
    roleName: string;
    color: string;
  }>;
  player: {
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    discordProfilePicture?: string;
  } | null;
  teams: {
    captainTeams: any[];
    memberTeams: any[];
  };
}

async function getUserDataHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const isDeveloper =
    session.user.id === DEVELOPER_ID ||
    session.user.id === DEVELOPER_DISCORD_ID;

  // Fetch all data in parallel
  const [
    discordRolesResult,
    playerResult,
    teamsResult,
  ] = await Promise.allSettled([
    // Fetch Discord roles and guild nickname
    (async () => {
      if (isDeveloper) {
        return { roles: [], guildNickname: null };
      }

      const botToken = process.env.DISCORD_BOT_TOKEN;
      const guildId = process.env.DISCORD_GUILD_ID;

      if (!botToken || !guildId) {
        return { roles: [], guildNickname: null };
      }

      try {
        const sanitizedGuildId = sanitizeString(guildId, 50);
        const discordResponse = await fetch(
          `https://discord.com/api/v10/guilds/${sanitizedGuildId}/members/${userId}`,
          {
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!discordResponse.ok) {
          return { roles: [], guildNickname: null };
        }

        const memberData = await discordResponse.json();
        const roles = Array.isArray(memberData.roles) ? memberData.roles : [];
        const guildNickname = memberData.nick
          ? sanitizeString(memberData.nick, 100)
          : null;

        return { roles, guildNickname };
      } catch (error) {
        safeLog.error("Discord API fetch error:", error);
        return { roles: [], guildNickname: null };
      }
    })(),
    // Fetch player data
    (async () => {
      try {
        const client = await clientPromise;
        const db = client.db("ShadowrunWeb");
        const player = await db
          .collection("Players")
          .findOne({ discordId: userId });

        if (!player) {
          return null;
        }

        return {
          discordId: player.discordId,
          discordUsername: player.discordUsername || null,
          discordNickname: player.discordNickname || null,
          discordProfilePicture: player.discordProfilePicture || null,
        };
      } catch (error) {
        safeLog.error("Error fetching player:", error);
        return null;
      }
    })(),
    // Fetch user teams from all collections
    (async () => {
      try {
        const client = await clientPromise;
        const db = client.db("ShadowrunWeb");
        const { getAllTeamCollectionNames } = await import("@/lib/team-collections");
        const collections = getAllTeamCollectionNames();

        const allCaptainTeams: any[] = [];
        const allMemberTeams: any[] = [];

        // Fetch from all team collections in parallel
        const teamPromises = collections.map(async (collectionName) => {
          const [captainTeams, memberTeams] = await Promise.all([
            db
              .collection(collectionName)
              .find({ "captain.discordId": userId })
              .toArray(),
            db
              .collection(collectionName)
              .find({
                "members.discordId": userId,
                "captain.discordId": { $ne: userId },
              })
              .toArray(),
          ]);

          return { captainTeams, memberTeams };
        });

        const results = await Promise.all(teamPromises);
        results.forEach(({ captainTeams, memberTeams }) => {
          allCaptainTeams.push(...captainTeams);
          allMemberTeams.push(...memberTeams);
        });

        return {
          captainTeams: allCaptainTeams.map((team) => ({
            _id: team._id.toString(),
            id: team._id.toString(),
            name: team.name,
            tag: team.tag,
          })),
          memberTeams: allMemberTeams.map((team) => ({
            _id: team._id.toString(),
            id: team._id.toString(),
            name: team.name,
            tag: team.tag,
          })),
        };
      } catch (error) {
        safeLog.error("Error fetching teams:", error);
        return { captainTeams: [], memberTeams: [] };
      }
    })(),
  ]);

  // Extract results
  const discordData =
    discordRolesResult.status === "fulfilled"
      ? discordRolesResult.value
      : { roles: [], guildNickname: null };
  const player =
    playerResult.status === "fulfilled" ? playerResult.value : null;
  const teams =
    teamsResult.status === "fulfilled"
      ? teamsResult.value
      : { captainTeams: [], memberTeams: [] };

  // Calculate permissions
  const userRoles = discordData.roles || [];
  const isAdmin =
    isDeveloper || userRoles.some((role: string) => ADMIN_ROLES.includes(role));
  const isModerator =
    isDeveloper || userRoles.some((role: string) => MOD_ROLES.includes(role));

  // Build role display (simplified - you may want to fetch role details)
  const roleDisplay = userRoles.map((roleId: string) => ({
    roleId,
    roleName: roleId, // You may want to fetch actual role names
    color: "#5865F2", // Default Discord color
  }));

  const userData: UserData = {
    permissions: {
      isAdmin,
      isModerator,
      canCreateTournament: isAdmin || isModerator,
      isDeveloper,
    },
    roles: userRoles,
    guildNickname: discordData.guildNickname,
    roleDisplay,
    player,
    teams,
  };

  const response = NextResponse.json(userData);
  response.headers.set(
    "Cache-Control",
    "private, s-maxage=60, stale-while-revalidate=120"
  );
  return response;
}

export const GET = withApiSecurity(getUserDataHandler, {
  rateLimiter: "api",
  requireAuth: true,
  cacheable: true,
  cacheMaxAge: 60,
});

