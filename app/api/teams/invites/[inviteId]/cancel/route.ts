import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";

type InviteStatus = "pending" | "accepted" | "declined" | "cancelled";

interface TeamInvite {
  _id: ObjectId;
  teamId: ObjectId;
  inviteeId: string;
  status: InviteStatus;
  createdAt: Date;
  cancelledAt?: Date;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Find the invite and check permissions
    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(params.inviteId),
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if user is team captain
    const team = await db.collection("Teams").findOne({
      _id: invite.teamId,
      "captain.discordId": session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: "Only team captain can cancel invites" },
        { status: 403 }
      );
    }

    // Cancel the invite with proper typing
    await db.collection<TeamInvite>("TeamInvites").updateOne(
      { _id: new ObjectId(params.inviteId) },
      {
        $set: {
          status: "cancelled" as const,
          cancelledAt: new Date(),
        },
      }
    );

    // Delete the notification
    await db.collection("Notifications").deleteOne({
      type: "team_invite",
      teamId: invite.teamId.toString(),
      userId: invite.inviteeId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cancel invite:", error);
    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}
