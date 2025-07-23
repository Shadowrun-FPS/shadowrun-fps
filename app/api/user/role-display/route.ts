import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";

export const dynamic = "force-dynamic";

// Safe role mapping - converts internal role IDs to display information
const ROLE_DISPLAY_MAP = {
  [SECURITY_CONFIG.ROLES.ADMIN]: { name: "Admin", color: "bg-red-500" },
  [SECURITY_CONFIG.ROLES.FOUNDER]: { name: "Founder", color: "bg-purple-500" },
  [SECURITY_CONFIG.ROLES.MODERATOR]: { name: "Mod", color: "bg-blue-500" },
  [SECURITY_CONFIG.ROLES.GM]: { name: "GM", color: "bg-green-500" },
} as const;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw createError.unauthorized("Authentication required");
  }

  try {
    // Get user roles from Discord API
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

      return NextResponse.json({
        roles: [],
        isDeveloper: session.user.id === SECURITY_CONFIG.DEVELOPER_ID,
        guildNickname: null,
      });
    }

    const data = await response.json();
    const userRoles = data.roles || [];

    // Map role IDs to safe display information
    const roleDisplay = userRoles
      .map((roleId: string) => {
        const display =
          ROLE_DISPLAY_MAP[roleId as keyof typeof ROLE_DISPLAY_MAP];
        return display
          ? {
              id: roleId, // This is safe to return as it's already known to the user
              name: display.name,
              color: display.color,
            }
          : null;
      })
      .filter(Boolean);

    // Add developer badge if applicable
    const isDeveloper = session.user.id === SECURITY_CONFIG.DEVELOPER_ID;
    if (isDeveloper) {
      roleDisplay.push({
        id: "developer",
        name: "Developer",
        color: "bg-green-600",
      });
    }

    secureLogger.info("Role display information retrieved", {
      userId: session.user.id,
      roleCount: roleDisplay.length,
    });

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
    return NextResponse.json({
      roles: [],
      isDeveloper: session.user.id === SECURITY_CONFIG.DEVELOPER_ID,
      guildNickname: null,
    });
  }
});
