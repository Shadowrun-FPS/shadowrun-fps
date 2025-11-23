import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to accept an invite" },
        { status: 401 }
      );
    }

    const inviteId = params.inviteId;
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
    const teamBeingJoined = await db.collection("Teams").findOne({
      _id: new ObjectId(invite.teamId),
    });

    if (!teamBeingJoined) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const teamSize = teamBeingJoined.teamSize || 4;

    // Check if user is already in a team of the SAME size
    const existingTeamOfSameSize = await db.collection("Teams").findOne(
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

    // If force parameter is not provided and user is in a team of the same size, return error with team info
    const { force } = await req.json().catch(() => ({ force: false }));

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
        .collection("Teams")
        .updateOne(
          { _id: existingTeamOfSameSize._id },
          pullUpdate as unknown as UpdateFilter<Document>
        );

      // Add notification to the team's captain
      const oldTeam = await db
        .collection("Teams")
        .findOne({ _id: existingTeamOfSameSize._id });

      if (oldTeam && oldTeam.captain) {
        await db.collection("Notifications").insertOne({
          userId: oldTeam.captain.discordId,
          type: "team_member_left",
          title: "Member Left Team",
          message: `${
            session.user.nickname || session.user.name
          } has left your team to join another team.`,
          read: false,
          createdAt: new Date(),
          metadata: {
            teamId: oldTeam._id.toString(),
            teamName: oldTeam.name,
            memberId: session.user.id,
            memberName: session.user.nickname || session.user.name,
          },
        });
      }
    }

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
    const teamUpdateResult = await db
      .collection("Teams")
      .updateOne({ _id: new ObjectId(invite.teamId) }, typedUpdateDoc);

    // Create notification for team captain
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(invite.teamId),
    });

    if (team) {
      await db.collection("Notifications").insertOne({
        userId: team.captain.discordId,
        type: "team_invite_accepted",
        title: "Team Invite Accepted",
        message: `${
          session.user.nickname || session.user.name
        } has joined your team`,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamId: invite.teamId.toString(),
          teamName: team.name,
          memberId: session.user.id,
          memberName: session.user.nickname || session.user.name,
        },
      });
    }

    // UPDATED: Recalculate team ELO with the new member
    await recalculateTeamElo(invite.teamId.toString());

    return NextResponse.json({
      success: true,
      message: "You have successfully joined the team",
    });
  } catch (error) {
    console.error("Error accepting team invite:", error);
    return NextResponse.json(
      { error: "Failed to accept team invite" },
      { status: 500 }
    );
  }
}
