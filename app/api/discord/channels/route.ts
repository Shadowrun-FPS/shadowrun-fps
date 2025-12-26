import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SECURITY_CONFIG, hasAdminRole, hasModeratorRole } from "@/lib/security-config";
import { withErrorHandling } from "@/lib/error-handling";

export const dynamic = 'force-dynamic';

const DISCORD_API_BASE = "https://discord.com/api/v10";

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

  // Fetch guild from database to get the correct guildId
  const guild = await db.collection("Guilds").findOne({});
  
  if (!guild || !guild.guildId) {
    return NextResponse.json({ error: "Guild not found or guild ID not configured" }, { status: 500 });
  }

  const GUILD_ID = guild.guildId;

  if (!process.env.DISCORD_BOT_TOKEN) {
    return NextResponse.json(
      { error: "Discord bot token not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${GUILD_ID}/channels`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discord API error for guild ${GUILD_ID} (${response.status}):`, errorText);
      // Return empty array instead of error so the UI can still load
      return NextResponse.json({ 
        channels: [],
        error: `Failed to fetch channels: ${response.status}` 
      });
    }

    const channels = await response.json();
    
    // Filter to only text channels (type 0) and categories (type 4)
    // Sort by position
    const filteredChannels = channels
      .filter((channel: any) => channel.type === 0 || channel.type === 4)
      .sort((a: any, b: any) => a.position - b.position)
      .map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
      }));

    return NextResponse.json({ channels: filteredChannels });
  } catch (error) {
    console.error("Error fetching Discord channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch Discord channels" },
      { status: 500 }
    );
  }
});

