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
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getPlayersHandler(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { db } = await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("count") === "true";

  if (countOnly) {
    const count = await db.collection("Players").countDocuments({});
    const response = NextResponse.json({ count });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
  }

  const players = await db.collection("Players").find({}).toArray();

  const response = NextResponse.json(players);
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getPlayersHandler, {
  rateLimiter: "admin",
  requireAuth: true,
});
