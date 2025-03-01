import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviterId, inviteeId } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check if inviter is team captain
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(params.teamId),
      "captain.discordId": inviterId,
    });

    if (!team) {
      return NextResponse.json(
        { error: "Only team captain can send invites" },
        { status: 403 }
      );
    }

    // Check team size limit (4 main players + 1 substitute)
    const currentMemberCount = team.members.length;
    const pendingInvitesCount = await db
      .collection("TeamInvites")
      .countDocuments({
        teamId: new ObjectId(params.teamId),
        status: "pending",
      });

    const totalPotentialMembers = currentMemberCount + pendingInvitesCount;
    if (totalPotentialMembers >= 5) {
      return NextResponse.json(
        { error: "Team has reached maximum size (4 players + 1 substitute)" },
        { status: 400 }
      );
    }

    // Check if player is already in team
    const isMember = team.members.some(
      (member: any) => member.discordId === inviteeId
    );
    if (isMember) {
      return NextResponse.json(
        { error: "Player is already a team member" },
        { status: 400 }
      );
    }

    // Check if invite already exists
    const existingInvite = await db.collection("TeamInvites").findOne({
      teamId: new ObjectId(params.teamId),
      inviteeId,
      status: "pending",
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already sent" },
        { status: 400 }
      );
    }

    // Create the invitation
    const invitation = {
      teamId: new ObjectId(params.teamId),
      inviterId,
      inviteeId,
      status: "pending",
      createdAt: new Date(),
    };

    // Save the invitation
    await db.collection("TeamInvites").insertOne(invitation);

    // Create notification
    await db.collection("Notifications").insertOne({
      type: "TEAM_INVITE",
      recipientId: inviteeId,
      senderId: session.user.id,
      senderName: session.user.name ?? "Unknown User",
      teamId: params.teamId,
      teamName: team.name,
      status: "PENDING",
      createdAt: Date.now(),
      message: `${
        session.user.name ?? "Unknown User"
      } has invited you to join ${team.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create team invite:", error);
    return NextResponse.json(
      { error: "Failed to create team invite" },
      { status: 500 }
    );
  }
}
