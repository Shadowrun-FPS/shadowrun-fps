import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
      "captain.discordId": session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: "Only team captain can clear invites" },
        { status: 403 }
      );
    }

    // Get all pending invites to delete notifications for them
    const pendingInvites = await db
      .collection("TeamInvites")
      .find({
        teamId: new ObjectId(teamId),
        status: "pending",
      })
      .toArray();

    // Delete notifications for all pending invites
    if (pendingInvites.length > 0) {
      const inviteIds = pendingInvites.map((invite) => invite._id.toString());

      await db.collection("Notifications").deleteMany({
        type: "team_invite",
        "metadata.teamId": teamId,
      });
    }

    // Update all pending invites to cancelled
    const result = await db.collection("TeamInvites").updateMany(
      {
        teamId: new ObjectId(teamId),
        status: "pending",
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} invites have been cleared`,
      clearedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error clearing team invites:", error);
    return NextResponse.json(
      { error: "Failed to clear invites" },
      { status: 500 }
    );
  }
}
