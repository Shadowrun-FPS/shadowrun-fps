import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { findTeamAcrossCollections } from "@/lib/team-collections";

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const inviteId = params.inviteId;

    // Get the invite
    const invite = await db.collection("TeamInvites").findOne({
      _id: new ObjectId(inviteId),
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Get the team to verify captain - search across all collections
    const teamResult = await findTeamAcrossCollections(db, invite.teamId.toString());
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;

    // Verify user is team captain
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team captain can cancel invites" },
        { status: 403 }
      );
    }

    // Cancel the invite
    await db
      .collection("TeamInvites")
      .updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: "cancelled" } }
      );

    // Delete any associated notifications
    await db.collection("Notifications").deleteMany({
      "metadata.inviteId": inviteId,
      type: "team_invite",
      userId: invite.inviteeId,
    });

    return NextResponse.json({
      success: true,
      message: "Invite cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling team invite:", error);
    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}
