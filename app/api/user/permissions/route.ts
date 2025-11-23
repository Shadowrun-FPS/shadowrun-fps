import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  SECURITY_CONFIG,
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
} from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";

// Developer ID for special permissions
const DEVELOPER_ID = SECURITY_CONFIG.DEVELOPER_ID;
const DEVELOPER_DISCORD_ID = "238329746671271936";

// Admin role IDs
const ADMIN_ROLES = ADMIN_ROLE_IDS;

// Moderator role IDs (includes admin roles)
const MOD_ROLES = MODERATOR_ROLE_IDS;

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({
      isAdmin: false,
      isModerator: false,
      canCreateTournament: false,
    });
  }

  // Always grant admin access to developer
  const isDeveloper = 
    session.user.id === DEVELOPER_ID || 
    session.user.id === DEVELOPER_DISCORD_ID;

  // Get user roles
  let userRoles: string[] = [];

  if (!isDeveloper) {
    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_URL}/api/discord/user-roles`,
        {
          headers: {
            Cookie: req.headers.get("cookie") || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        userRoles = data.roles || [];
      }
    } catch (error) {
      secureLogger.error("Error fetching user roles", { error });
      // Continue without roles rather than failing
    }
  }

  const isAdmin =
    isDeveloper || userRoles.some((role) => ADMIN_ROLES.includes(role));
  const isModerator =
    isDeveloper || userRoles.some((role) => MOD_ROLES.includes(role));

  return NextResponse.json({
    isAdmin,
    isModerator,
    canCreateTournament: isAdmin || isModerator,
    isDeveloper,
  });
});
