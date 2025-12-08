import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postJoinRequestHandler(
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

  const { db } = await connectToDatabase();
  const currentUserId = session.user.id;
  const currentUserName = sanitizeString(session.user.name || "Unknown", 100);
  const currentUserImage = session.user.image || "";

    // Get the team across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const { team, collectionName } = teamResult;
    const teamSize = team.teamSize || 4;

    // Check if user is already a member
    const isMember = team.members.some(
      (member: any) => member.discordId === currentUserId
    );

    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Check if there's a pending request already
    const existingRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: currentUserId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request to join this team" },
        { status: 400 }
      );
    }

    // Get player data to ensure we have the latest information
    const player = await db.collection("Players").findOne({
      discordId: currentUserId,
    });

    await db.collection("TeamJoinRequests").insertOne({
      teamId,
      teamName: sanitizeString(team.name || "", 100),
      teamSize,
      userId: sanitizeString(currentUserId, 50),
      userName: currentUserName,
      userImage: currentUserImage || null,
      userNickname: sanitizeString(
        player?.discordNickname || session.user.nickname || currentUserName,
        100
      ),
      playerId: player?._id ? player._id.toString() : null,
      status: "pending",
      createdAt: new Date(),
    });

    // First, query for the join request and store the result
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: currentUserId,
    });

    // Then check if it exists before using its ID
    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    await db.collection("Notifications").insertOne({
      userId: sanitizeString(team.captain.discordId, 50),
      type: "team_join_request",
      title: "Team Join Request",
      message: sanitizeString(
        `${currentUserName} has requested to join your team "${team.name}"`,
        500
      ),
      read: false,
      createdAt: new Date(),
      discordUsername: sanitizeString(team.captain.discordUsername || "Unknown", 100),
      discordNickname: sanitizeString(team.captain.discordNickname || "Unknown", 100),
      metadata: {
        teamId,
        teamName: sanitizeString(team.name || "", 100),
        userId: sanitizeString(currentUserId, 50),
        userName: currentUserName,
        userAvatar: currentUserImage || null,
        requestId: joinRequest._id.toString(),
      },
    });

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully",
    });
}

export const POST = withApiSecurity(postJoinRequestHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
