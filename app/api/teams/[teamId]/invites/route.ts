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

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Check if user is team captain
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(params.teamId),
      "captain.discordId": session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: "Only team captain can view invites" },
        { status: 403 }
      );
    }

    const invites = await db
      .collection<TeamInvite>("TeamInvites")
      .find({ teamId: new ObjectId(params.teamId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get invitee names
    const inviteeIds = invites.map((invite) => invite.inviteeId);
    const players = await db
      .collection("Players")
      .find({ discordId: { $in: inviteeIds } })
      .toArray();

    const playerMap = new Map(
      players.map((p) => [p.discordId, p.discordNickname || p.bumjamas])
    );

    const formattedInvites = invites.map((invite) => ({
      _id: invite._id.toString(),
      inviteeId: invite.inviteeId,
      inviteeName: playerMap.get(invite.inviteeId) || "Unknown Player",
      status: invite.status,
      createdAt: invite.createdAt.toISOString(),
      cancelledAt: invite.cancelledAt?.toISOString(),
    }));

    return NextResponse.json(formattedInvites);
  } catch (error) {
    console.error("Failed to fetch team invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch team invites" },
      { status: 500 }
    );
  }
}
