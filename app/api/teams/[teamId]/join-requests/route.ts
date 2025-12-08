import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getJoinRequestsHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");
  const userId = userIdParam ? sanitizeString(userIdParam, 50) : session.user.id;
  const { db } = await connectToDatabase();

    // Check for any pending requests
    const pendingRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: userId,
      status: "pending",
    });

    const response = NextResponse.json({
      hasPendingRequest: !!pendingRequest,
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getJoinRequestsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
