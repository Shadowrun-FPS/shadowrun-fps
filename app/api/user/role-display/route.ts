import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";

export const dynamic = "force-dynamic";

// Safe role mapping - converts internal role IDs to display information
// Use hardcoded role IDs as fallback to ensure they always work
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || "932585751332421642";
const FOUNDER_ROLE_ID = process.env.FOUNDER_ROLE_ID || "1095126043918082109";
const MODERATOR_ROLE_ID =
  process.env.MODERATOR_ROLE_ID || "1042168064805965864";
const GM_ROLE_ID = process.env.GM_ROLE_ID || "1080979865345458256";

const ROLE_DISPLAY_MAP: Record<string, { name: string; color: string }> = {
  [ADMIN_ROLE_ID]: { name: "Admin", color: "bg-red-600" },
  [FOUNDER_ROLE_ID]: { name: "Founder", color: "bg-purple-600" },
  [MODERATOR_ROLE_ID]: { name: "Moderator", color: "bg-blue-600" },
  [GM_ROLE_ID]: { name: "GM", color: "bg-green-500" },
  // Also include the ones from SECURITY_CONFIG as fallback
  [SECURITY_CONFIG.ROLES.ADMIN]: { name: "Admin", color: "bg-red-600" },
  [SECURITY_CONFIG.ROLES.FOUNDER]: { name: "Founder", color: "bg-purple-600" },
  [SECURITY_CONFIG.ROLES.MODERATOR]: {
    name: "Moderator",
    color: "bg-blue-600",
  },
  [SECURITY_CONFIG.ROLES.GM]: { name: "GM", color: "bg-green-500" },
};

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw createError.unauthorized("Authentication required");
  }

  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

    const response = await fetch(`${baseUrl}/api/discord/user-roles`, {
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      secureLogger.warn("Failed to fetch user roles for display mapping", {
        userId: session.user.id,
        status: response.status,
        statusText: response.statusText,
      });

      const DEVELOPER_DISCORD_ID = "238329746671271936";
      const isDeveloper =
        session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
        session.user.id === DEVELOPER_DISCORD_ID;

      return NextResponse.json({
        roles: isDeveloper
          ? [
              {
                id: "developer",
                name: "Developer",
                color: "bg-gradient-to-r from-green-600 to-emerald-500",
              },
            ]
          : [],
        isDeveloper,
        guildNickname: null,
      });
    }

    const data = await response.json();
    const userRoles = data.roles || [];

    // Map role IDs to safe display information
    // Ensure role IDs are compared as strings
    const roleDisplay = userRoles
      .map((roleId: string | number) => {
        // Convert to string to ensure proper comparison
        const roleIdStr = String(roleId);
        const display = ROLE_DISPLAY_MAP[roleIdStr];

        if (display) {
          return {
            id: roleIdStr,
            name: display.name,
            color: display.color,
          };
        }

        secureLogger.debug("Unmapped role ID", {
          roleId: roleIdStr,
          userId: session.user.id,
        });

        return null;
      })
      .filter(Boolean);

    const DEVELOPER_DISCORD_ID = "238329746671271936";
    const isDeveloper =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session.user.id === DEVELOPER_DISCORD_ID;

    if (isDeveloper) {
      roleDisplay.push({
        id: "developer",
        name: "Developer",
        color: "bg-gradient-to-r from-green-600 to-emerald-500",
      });
    }

    return NextResponse.json({
      roles: roleDisplay,
      isDeveloper,
      guildNickname: data.guildNickname || null,
    });
  } catch (error) {
    secureLogger.error("Error in role display mapping", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return safe fallback
    const DEVELOPER_DISCORD_ID = "238329746671271936";
    const isDeveloper =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session.user.id === DEVELOPER_DISCORD_ID;

    return NextResponse.json({
      roles: isDeveloper
        ? [
            {
              id: "developer",
              name: "Developer",
              color: "bg-gradient-to-r from-green-600 to-emerald-500",
            },
          ]
        : [],
      isDeveloper,
      guildNickname: null,
    });
  }
});
