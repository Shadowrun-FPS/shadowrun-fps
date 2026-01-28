import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { ensurePlayerEloForAllTeamSizes } from "@/lib/ensure-player-elo";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postAcceptHandler(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to accept an invite" },
      { status: 401 }
    );
  }

  const inviteId = sanitizeString(params.inviteId, 50);
  if (!ObjectId.isValid(inviteId)) {
    return NextResponse.json(
      { error: "Invalid invite ID format" },
      { status: 400 }
    );
  }
    const client = await clientPromise;
    const db = client.db();

    // Find the invite
    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(inviteId),
      inviteeId: session.user.id,
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    // Get the team being joined to check its size
    const teamResult = await findTeamAcrossCollections(db, invite.teamId);
    if (!teamResult) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }
    const teamBeingJoined = teamResult.team;
    const teamSize = teamBeingJoined.teamSize || 4;

    // Check if user is already in a team of the SAME size
    const collectionName = getTeamCollectionName(teamSize);
    const existingTeamOfSameSize = await db.collection(collectionName).findOne(
      {
        "members.discordId": session.user.id,
        teamSize: teamSize,
        _id: { $ne: new ObjectId(invite.teamId) }, // Exclude the team being joined
      },
      {
        projection: {
          _id: 1,
          name: 1,
          teamSize: 1,
        },
      }
    );

    const body = await req.json().catch(() => ({}));
    const validation = validateBody(body, {
      force: { type: "boolean", required: false },
    });
    const force = validation.data?.force || false;

    if (existingTeamOfSameSize && !force) {
      return NextResponse.json(
        {
          error: "Already in a team of this size",
          message: `You are already a member of a ${teamSize}-person team "${existingTeamOfSameSize.name}". You must leave your current team before joining another team of the same size.`,
          currentTeam: {
            id: existingTeamOfSameSize._id.toString(),
            name: existingTeamOfSameSize.name,
          },
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    // If force is true and user is in a team of the same size, remove them from that team first
    if (existingTeamOfSameSize && force) {
      const pullUpdate = {
        $pull: {
          members: {
            discordId: session.user.id,
          },
        },
      };

      await db
        .collection(collectionName)
        .updateOne(
          { _id: existingTeamOfSameSize._id },
          pullUpdate as unknown as UpdateFilter<Document>
        );

      // Add notification to the team's captain
      const oldTeam = await db
        .collection(collectionName)
        .findOne({ _id: existingTeamOfSameSize._id });

      if (oldTeam && oldTeam.captain) {
        await db.collection("Notifications").insertOne({
          userId: oldTeam.captain.discordId,
          type: "team_member_left",
          title: "Member Left Team",
          message: `${sanitizeString(session.user.nickname || session.user.name || "", 100)} has left your team to join another team.`,
          read: false,
          createdAt: new Date(),
          metadata: {
            teamId: oldTeam._id.toString(),
            teamName: oldTeam.name,
            memberId: session.user.id,
            memberName: session.user.nickname || session.user.name,
            userName: session.user.nickname || session.user.name,
            userAvatar: session.user.image || undefined,
          },
        });
      }
    }

    // Ensure user has ELO records for all team sizes before joining
    await ensurePlayerEloForAllTeamSizes(session.user.id);

    // Update invite status
    await db
      .collection("TeamInvites")
      .updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: "accepted", acceptedAt: new Date() } }
      );

    // Add user to team with proper profile data
    const newMember = {
      discordId: session.user.id,
      discordNickname: session.user.nickname || session.user.name,
      discordUsername: session.user.name,
      discordProfilePicture: session.user.image || "",
      role: "member",
      joinedAt: new Date(),
    };

    // Create the update document
    const updateDoc = {
      $push: {
        members: newMember,
      },
    };

    // Cast it to the proper MongoDB type
    const typedUpdateDoc = updateDoc as unknown as UpdateFilter<Document>;

    // Use the typed update document in the MongoDB operation
    const teamCollectionName = getTeamCollectionName(teamSize);
    const teamUpdateResult = await db
      .collection(teamCollectionName)
      .updateOne({ _id: new ObjectId(invite.teamId) }, typedUpdateDoc);

    // Create notification for team captain
    const team = await db.collection(teamCollectionName).findOne({
      _id: new ObjectId(invite.teamId),
    });

    if (team) {
      await db.collection("Notifications").insertOne({
        userId: team.captain.discordId,
        type: "team_invite_accepted",
        title: "Team Invite Accepted",
        message: `${sanitizeString(session.user.nickname || session.user.name || "", 100)} has joined your team`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: invite.teamId.toString(),
          teamName: team.name,
          memberId: session.user.id,
          memberName: session.user.nickname || session.user.name,
          userName: session.user.nickname || session.user.name,
          userAvatar: session.user.image || undefined,
        },
      });
    }

    await recalculateTeamElo(invite.teamId.toString());

    revalidatePath("/teams");
    revalidatePath(`/teams/${invite.teamId.toString()}`);
    revalidatePath("/notifications");

    return NextResponse.json({
      success: true,
      message: "You have successfully joined the team",
    });
}

export const POST = withApiSecurity(postAcceptHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams", "/notifications"],
});
