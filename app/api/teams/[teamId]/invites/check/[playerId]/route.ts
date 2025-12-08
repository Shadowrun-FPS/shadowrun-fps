import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getCheckInviteHandler(
  req: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ teamId: string; playerId: string }>
      | { teamId: string; playerId: string };
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const teamId = sanitizeString(resolvedParams.teamId, 50);
  const playerId = sanitizeString(resolvedParams.playerId, 50);

  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

    const query = {
      teamId: new ObjectId(teamId),
      inviteeId: playerId,
      status: "pending",
    };

    const pendingInvite = await db.collection("TeamInvites").findOne(query);

    const response = NextResponse.json({
      isInvited: !!pendingInvite,
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getCheckInviteHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
