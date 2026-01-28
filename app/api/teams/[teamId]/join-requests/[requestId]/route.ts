import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { ensurePlayerEloForAllTeamSizes } from "@/lib/ensure-player-elo";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function getJoinRequestStatusHandler(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; requestId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId: rawTeamId, requestId: rawRequestId } = await params;
  const teamId = sanitizeString(rawTeamId, 50);
  const requestId = sanitizeString(rawRequestId, 50);

  if (!ObjectId.isValid(teamId) || !ObjectId.isValid(requestId)) {
    return NextResponse.json(
      { error: "Invalid team ID or request ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Get the join request
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      _id: new ObjectId(requestId),
      teamId: teamId,
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      status: joinRequest.status || "pending",
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getJoinRequestStatusHandler, {
  rateLimiter: "api",
  requireAuth: true,
});

async function postJoinRequestActionHandler(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; requestId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId: rawTeamId, requestId: rawRequestId } = await params;
  const teamId = sanitizeString(rawTeamId, 50);
  const requestId = sanitizeString(rawRequestId, 50);

  if (!ObjectId.isValid(teamId) || !ObjectId.isValid(requestId)) {
    return NextResponse.json(
      { error: "Invalid team ID or request ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    action: {
      type: "string",
      required: true,
      pattern: /^(accept|reject)$/,
    },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid action. Must be 'accept' or 'reject'" },
      { status: 400 }
    );
  }

  const { action } = validation.data! as { action: string };
  const { db } = await connectToDatabase();

    // Verify user is team captain - search across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }
    const { team, collectionName } = teamResult;
    
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not the captain of this team" },
        { status: 403 }
      );
    }

    // Get the join request
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      _id: new ObjectId(requestId),
      teamId: teamId,
      status: "pending",
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // Update request status
    await db.collection("TeamJoinRequests").updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: action === "accept" ? "accepted" : "rejected",
          updatedAt: new Date(),
        },
      }
    );

    // If accepting, add the user to the team
    if (action === "accept") {
      const teamSize = team.teamSize || 4;

      // Check if user is already in a team of the SAME size
      const teamCollectionName = getTeamCollectionName(teamSize);
      const existingTeamOfSameSize = await db.collection(teamCollectionName).findOne({
        $or: [
          { "members.discordId": joinRequest.userId },
          { "captain.discordId": joinRequest.userId },
        ],
        _id: { $ne: new ObjectId(teamId) }, // Exclude the team they're joining
      });

      if (existingTeamOfSameSize) {
        // Update request status to rejected
        await db.collection("TeamJoinRequests").updateOne(
          { _id: new ObjectId(requestId) },
          {
            $set: {
              status: "rejected",
              updatedAt: new Date(),
              rejectionReason: `User is already in a ${teamSize}-person team`,
            },
          }
        );

        // Notify the user
        await db.collection("Notifications").insertOne({
          userId: joinRequest.userId,
          type: "team_join_rejected",
          title: "Join Request Cannot Be Accepted",
          message: `Your request to join "${team.name}" cannot be accepted because you are already a member of a ${teamSize}-person team "${existingTeamOfSameSize.name}".`,
          read: false,
          createdAt: new Date(),
          metadata: {
            teamId: teamId,
            teamName: team.name,
          },
        });

        // Notify the captain
        await db.collection("Notifications").insertOne({
          userId: team.captain.discordId,
          type: "team_join_request",
          title: "Join Request Auto-Rejected",
          message: `The join request from ${joinRequest.userNickname || joinRequest.userName} was automatically rejected because they are already in a ${teamSize}-person team.`,
          read: false,
          createdAt: new Date(),
          metadata: {
            teamId: teamId,
            teamName: team.name,
            requesterId: joinRequest.userId,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: `User is already in a ${teamSize}-person team. Request has been rejected.`,
          },
          { status: 400 }
        );
      }

      // Ensure user has ELO records for all team sizes before joining
      await ensurePlayerEloForAllTeamSizes(joinRequest.userId);

      // Get teamSize from joinRequest if stored, otherwise from team
      const requestTeamSize = joinRequest.teamSize || teamSize;

      // Cancel all other pending join requests for teams of the same size
      await db.collection("TeamJoinRequests").updateMany(
        {
          userId: joinRequest.userId,
          status: "pending",
          teamSize: requestTeamSize,
          _id: { $ne: new ObjectId(requestId) }, // Don't cancel the current request
        },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
            cancellationReason: "User joined another team of the same size",
          },
        }
      );

      const newMember = {
        discordId: sanitizeString(joinRequest.userId, 50),
        discordNickname: sanitizeString(joinRequest.userNickname || joinRequest.userName || "", 100),
        discordUsername: sanitizeString(joinRequest.userName || "", 100),
        discordProfilePicture: sanitizeString(joinRequest.userAvatar || "", 255),
        role: "member",
        joinedAt: new Date(),
      };

      // Add the user to the team with proper type casting
      await db
        .collection(collectionName)
        .updateOne(
          { _id: new ObjectId(teamId) },
          { $push: { members: newMember } as any }
        );

      await db.collection("Notifications").insertOne({
        userId: sanitizeString(joinRequest.userId, 50),
        type: "team_join_accepted",
        title: "Team Join Request Accepted",
        message: sanitizeString(
          `Your request to join team "${team.name}" has been accepted`,
          500
        ),
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId,
          teamName: sanitizeString(team.name || "", 100),
        },
      });

      const updatedElo = await recalculateTeamElo(teamId);

      revalidatePath("/teams");
      revalidatePath(`/teams/${teamId}`);

      return NextResponse.json({
        success: true,
        action: action,
        message: "Join request accepted",
        teamElo: updatedElo,
      });
    } else {
      await db.collection("Notifications").insertOne({
        userId: sanitizeString(joinRequest.userId, 50),
        type: "team_join_rejected",
        title: "Team Join Request Rejected",
        message: sanitizeString(
          `Your request to join team "${team.name}" has been rejected`,
          500
        ),
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId,
          teamName: sanitizeString(team.name || "", 100),
        },
      });

      revalidatePath("/teams");
      revalidatePath(`/teams/${teamId}`);

      return NextResponse.json({
        success: true,
        action: action,
        message: "Join request rejected",
      });
    }
}

export const POST = withApiSecurity(postJoinRequestActionHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
