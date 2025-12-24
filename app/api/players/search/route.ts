import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SECURITY_CONFIG, hasAdminRole, hasModeratorRole } from "@/lib/security-config";
import { withErrorHandling } from "@/lib/error-handling";

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDatabase();

  // Check if user is admin - fetch roles from database
  const DEVELOPER_DISCORD_ID = "238329746671271936";
  const isDeveloper =
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
    session.user.id === DEVELOPER_DISCORD_ID;

  // Fetch user from database to get roles
  const user = await db.collection("Players").findOne({
    discordId: session.user.id,
  });

  const userRoles = user?.roles || session.user.roles || [];
  const userHasAdminRole = hasAdminRole(userRoles);
  const userHasModeratorRole = hasModeratorRole(userRoles);
  const isAdminUser = session.user.isAdmin || user?.isAdmin;

  const isAuthorized =
    isDeveloper || isAdminUser || userHasAdminRole || userHasModeratorRole;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json({ players: [] });
  }

  try {
    // Search by Discord ID (exact match) or nickname/username (partial match)
    const players = await db
      .collection("Players")
      .find({
        $or: [
          { discordId: query },
          { discordNickname: { $regex: query, $options: "i" } },
          { discordUsername: { $regex: query, $options: "i" } },
        ],
      })
      .limit(10)
      .toArray();

    const results = players.map((player) => ({
      discordId: player.discordId,
      discordNickname: player.discordNickname,
      discordUsername: player.discordUsername,
    }));

    return NextResponse.json({ players: results });
  } catch (error) {
    console.error("Error searching players:", error);
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
});
