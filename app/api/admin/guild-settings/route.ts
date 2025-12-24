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
    discordId: session.user.id 
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
  
  // Get the guild settings (assuming there's only one guild for this instance)
  const guild = await db.collection("Guilds").findOne({});
  
  if (!guild) {
    return NextResponse.json({ error: "Guild not found" }, { status: 404 });
  }

  return NextResponse.json(guild);
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
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
    discordId: session.user.id 
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

  const body = await req.json();
  
  const {
    guildId,
    adminRoleIds,
    moderatorRoleIds,
    queueManagerRoleIds,
    tournamentManagerRoleIds,
    rankedCategoryId,
    queueChannelId,
    matchChannelId,
    leaderboardChannelId,
    teamsChannelId,
    tournamentsChannelId,
    logsChannelId,
    hideNameElo,
    ranks,
    settings,
  } = body;

  // Update guild settings
  const result = await db.collection("Guilds").updateOne(
    { guildId },
    {
      $set: {
        adminRoleIds: Array.isArray(adminRoleIds) ? adminRoleIds : [],
        moderatorRoleIds: Array.isArray(moderatorRoleIds) ? moderatorRoleIds : [],
        queueManagerRoleIds: Array.isArray(queueManagerRoleIds) ? queueManagerRoleIds : [],
        tournamentManagerRoleIds: Array.isArray(tournamentManagerRoleIds) ? tournamentManagerRoleIds : [],
        rankedCategoryId,
        queueChannelId,
        matchChannelId,
        leaderboardChannelId,
        teamsChannelId,
        tournamentsChannelId,
        logsChannelId,
        hideNameElo,
        ranks: ranks || {},
        settings,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Guild not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});

