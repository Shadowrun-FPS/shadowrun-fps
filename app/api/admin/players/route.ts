import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
  SECURITY_CONFIG,
  hasAdminRole,
  hasModeratorRole,
} from "@/lib/security-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required roles
    const DEVELOPER_DISCORD_ID = "238329746671271936";
    const isDeveloper = 
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID || 
      session.user.id === DEVELOPER_DISCORD_ID;
    
    const userRoles = session.user.roles || [];
    const userHasAdminRole = hasAdminRole(userRoles);
    const userHasModeratorRole = hasModeratorRole(userRoles);
    const isAdminUser = session.user.isAdmin;

    const isAuthorized =
      isDeveloper || isAdminUser || userHasAdminRole || userHasModeratorRole;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Check if count is requested
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("count") === "true";

    if (countOnly) {
      const count = await db.collection("Players").countDocuments({});
      return NextResponse.json({ count });
    }

    // Fetch players from database
    const players = await db.collection("Players").find({}).toArray();

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
