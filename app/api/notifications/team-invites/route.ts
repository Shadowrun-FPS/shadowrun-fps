import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getTeamInvitesNotificationsHandler() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const invites = await db
    .collection("TeamInvites")
    .find({
      invitedId: userId,
      status: "pending",
    })
    .toArray();

  const response = NextResponse.json(invites);
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getTeamInvitesNotificationsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
