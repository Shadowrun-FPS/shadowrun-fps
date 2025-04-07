import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Developer ID for special permissions
const DEVELOPER_ID = "238329746671271936";

// Admin role IDs
const ADMIN_ROLES = [
  "932585751332421642", // Admin
  "1095126043918082109", // Founder
];

// Moderator role IDs (includes admin roles)
const MOD_ROLES = [
  ...ADMIN_ROLES,
  "1042168064805965864", // Mod
  "1080979865345458256", // GM
];

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({
        isAdmin: false,
        isModerator: false,
        canCreateTournament: false,
      });
    }

    // Always grant admin access to developer
    const isDeveloper = session.user.id === DEVELOPER_ID;

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
        console.error("Error fetching user roles:", error);
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
  } catch (error) {
    console.error("Error checking permissions:", error);
    return NextResponse.json(
      { error: "Failed to check permissions" },
      { status: 500 }
    );
  }
}
