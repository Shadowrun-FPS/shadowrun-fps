import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getFindJoinRequestHandler(
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
  const userId = userIdParam ? sanitizeString(userIdParam, 50) : null;

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Verify team captain - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult || teamResult.team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not the captain of this team" },
        { status: 403 }
      );
    }
    const team = teamResult.team;

    // Find pending request
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: userId,
      status: "pending",
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "No pending join request found" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      requestId: joinRequest._id.toString(),
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getFindJoinRequestHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
