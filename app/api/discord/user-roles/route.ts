import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGuildData } from "@/lib/discord-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized or missing access token" },
        { status: 401 }
      );
    }

    // For the developer account, return hardcoded admin role without calling Discord API
    if (session.user.id === "238329746671271936") {
      // Use nickname from session if available
      const nickname = session.user.nickname || session.user.name;

      return NextResponse.json({
        roles: ["932585751332421642"], // Admin role ID
        guildNickname: nickname,
        isModerator: true,
        isAdmin: true,
      });
    }

    try {
      const guildData = await getGuildData(session.accessToken);

      if (!guildData) {
        console.log("No guild data returned for user", session.user.id);
        // Use nickname from session if available
        const fallbackName = session.user.nickname || session.user.name;

        return NextResponse.json({
          roles: [],
          guildNickname: fallbackName,
          isModerator: false,
          isAdmin: false,
        });
      }

      const modRoleIds = [
        "932585751332421642", // Admin
        "1095126043918082109", // Founder
        "1042168064805965864", // Mod
      ];

      // Create a copy of the roles array, ensuring it exists
      const roles = Array.isArray(guildData.roles) ? [...guildData.roles] : [];

      // Prioritize guild nickname from API, then session nickname
      const nickname =
        guildData.nick || session.user.nickname || session.user.name;
      console.log(`Using nickname: ${nickname} for user ${session.user.id}`);

      return NextResponse.json({
        roles: roles,
        guildNickname: nickname,
        isModerator: roles.some((roleId) => modRoleIds.includes(roleId)),
        isAdmin: roles.includes("932585751332421642"),
      });
    } catch (error) {
      console.error("Error in guild data fetching:", error);

      // Fall back to session data if guild data fails
      const fallbackName = session.user.nickname || session.user.name;

      return NextResponse.json({
        roles: [],
        guildNickname: fallbackName,
        isModerator: session.user.id === "238329746671271936",
        isAdmin: session.user.id === "238329746671271936",
      });
    }
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}
