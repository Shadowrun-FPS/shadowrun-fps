import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { notifyTeamJoinRequest } from "@/lib/discord-bot-api";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postRequestJoinHandler(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to request joining a team" },
      { status: 401 }
    );
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const userId = session.user.id;
  const userName = sanitizeString(session.user.name || "Unknown User", 100);

    // Check that the team exists across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const { team, collectionName } = teamResult;

    // Check if user is already a member of the team
    const isMember = team.members.some((m: any) => m.discordId === userId);
    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Get team size (default to 4 if not specified)
    const teamSize = team.teamSize || 4;

    // Check if the team is full
    const memberCount = team.members.length;
    const captainInMembers = team.members.some(
      (m: any) => m.discordId === team.captain?.discordId
    );
    const totalMembers = captainInMembers ? memberCount : memberCount + 1;

    if (totalMembers >= teamSize) {
      return NextResponse.json(
        { error: `This team is full (${teamSize}/${teamSize} members)` },
        { status: 400 }
      );
    }

    // Check if user is already in a team of the SAME size
    const teamCollectionName = getTeamCollectionName(teamSize);
    const existingTeamOfSameSize = await db.collection(teamCollectionName).findOne({
      $or: [
        { "members.discordId": userId },
        { "captain.discordId": userId },
      ],
    });

    if (existingTeamOfSameSize) {
      return NextResponse.json(
        {
          error: `You are already a member of a ${teamSize}-person team "${existingTeamOfSameSize.name}". You must leave your current team before joining another team of the same size.`,
        },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: team._id.toString(),
      userId: userId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request to join this team" },
        { status: 400 }
      );
    }

    const joinRequestResult = await db
      .collection("TeamJoinRequests")
      .insertOne({
        teamId: team._id.toString(),
        teamName: sanitizeString(team.name, 100),
        teamSize: teamSize,
        userId: session.user.id,
        userName: sanitizeString(session.user.name || "", 100),
        userNickname: sanitizeString(session.user.nickname || session.user.name || "", 100),
        userAvatar: session.user.image || null,
        status: "pending",
        createdAt: new Date(),
      });

    await db.collection("Notifications").insertOne({
      userId: team.captain.discordId,
      type: "team_join_request",
      title: "New Team Join Request",
      message: `${sanitizeString(session.user.nickname || userName, 100)} has requested to join your team "${sanitizeString(team.name, 100)}"`,
      read: false,
      createdAt: new Date(),
      metadata: {
        teamId: teamId,
        teamName: sanitizeString(team.name, 100),
        requesterId: userId,
        requesterName: sanitizeString(session.user.nickname || userName, 100),
        requestId: joinRequestResult.insertedId.toString(),
      },
    });

    try {
      await notifyTeamJoinRequest(
        teamId,
        userId,
        sanitizeString(session.user.nickname || userName, 100),
        sanitizeString(team.name, 100),
        team.captain.discordId
      );
    } catch (error) {
      safeLog.error("Failed to send Discord notification for join request:", error);
    }

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully",
    });
}

export const POST = withApiSecurity(postRequestJoinHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
