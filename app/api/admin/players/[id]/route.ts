import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { playersRouteIdFilter } from "@/lib/admin-player-lookup";

async function getPlayerHandler(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const playerId = sanitizeString(rawId, 50);
  const lookup = playersRouteIdFilter(playerId);
  if (!lookup) {
    return NextResponse.json(
      { error: "Invalid player ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const player = await db.collection("Players").findOne(lookup);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const response = NextResponse.json(player);
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getPlayerHandler, {
  rateLimiter: "admin",
  requireAuth: true,
});
