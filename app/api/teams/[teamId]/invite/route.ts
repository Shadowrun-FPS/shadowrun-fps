import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;

    // Verify user is team captain
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if the current user is the team captain
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team captain can send invites" },
        { status: 403 }
      );
    }

    // Add debug logging
    console.log("Current user ID:", session.user.id);
    console.log("Team captain ID:", team.captain.discordId);
    console.log(
      "Is captain match:",
      team.captain.discordId === session.user.id
    );

    const { playerId, playerName } = await req.json();

    // Simply count the members array length
    const memberCount = team.members.length;

    // Get pending invites for debugging only
    const pendingInvites = await db
      .collection("TeamInvites")
      .find({
        teamId: new ObjectId(teamId),
        status: "pending",
      })
      .toArray();

    // Add detailed debugging logs
    console.log("Members array length:", memberCount);
    console.log("Pending invites count:", pendingInvites.length);
    console.log(
      "Pending invites details:",
      pendingInvites.map((invite) => ({
        inviteeId: invite.inviteeId,
        inviteeName: invite.inviteeName,
        createdAt: invite.createdAt,
      }))
    );

    // Check if the team has reached maximum size (4 members)
    // Without counting pending invites
    if (memberCount >= 4) {
      return NextResponse.json(
        { error: "Team has reached maximum size (4 players)" },
        { status: 400 }
      );
    }

    // Check if player is already in team
    const isMember = team.members.some(
      (member: any) => member.discordId === playerId
    );
    if (isMember) {
      return NextResponse.json(
        { error: "Player is already a team member" },
        { status: 400 }
      );
    }

    // Check if a PENDING invite already exists (not just any status)
    const existingInvite = await db.collection("TeamInvites").findOne({
      teamId: new ObjectId(teamId),
      inviteeId: playerId,
      status: "pending", // Only check for pending invites
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already sent" },
        { status: 400 }
      );
    }

    // Allow re-inviting if previous invite was cancelled, rejected or expired

    // Create the invitation document
    const invitation = {
      teamId: new ObjectId(teamId),
      teamName: team.name,
      inviterId: session.user.id,
      inviterName: session.user.name,
      inviteeId: playerId,
      inviteeName: playerName,
      status: "pending",
      createdAt: new Date(),
    };

    // Insert the invitation and capture the result with the generated _id
    const result = await db.collection("TeamInvites").insertOne(invitation);

    // Create a notification for the invitee
    await db.collection("Notifications").insertOne({
      userId: playerId,
      type: "team_invite",
      title: "Team Invitation",
      message: `You have been invited to join ${team.name}`,
      read: false,
      createdAt: new Date(),
      inviterName: session.user.name,
      metadata: {
        teamId: teamId,
        teamName: team.name,
        inviteId: result.insertedId.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invite sent to ${playerName}`,
    });
  } catch (error) {
    console.error("Failed to create team invite:", error);
    return NextResponse.json(
      { error: "Failed to create team invite" },
      { status: 500 }
    );
  }
}
