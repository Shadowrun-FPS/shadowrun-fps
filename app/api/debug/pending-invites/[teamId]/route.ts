import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
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

    // Get all pending invites for this team
    const pendingInvites = await db
      .collection("TeamInvites")
      .find({
        teamId: new ObjectId(teamId),
        status: "pending",
      })
      .toArray();

    return NextResponse.json({
      pendingInvites: pendingInvites.map((invite) => ({
        id: invite._id.toString(),
        teamId: invite.teamId.toString(),
        inviteeId: invite.inviteeId,
        inviteeName: invite.inviteeName,
        status: invite.status,
        createdAt: invite.createdAt,
      })),
      count: pendingInvites.length,
    });
  } catch (error) {
    console.error("Error fetching pending invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending invites" },
      { status: 500 }
    );
  }
}

// Add a DELETE endpoint to cancel all pending invites
export async function DELETE(
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
      "captain.discordId": session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or you are not the captain" },
        { status: 403 }
      );
    }

    // Delete all pending invites
    const result = await db.collection("TeamInvites").deleteMany({
      teamId: new ObjectId(teamId),
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} pending invites`,
    });
  } catch (error) {
    console.error("Error deleting pending invites:", error);
    return NextResponse.json(
      { error: "Failed to delete pending invites" },
      { status: 500 }
    );
  }
}
