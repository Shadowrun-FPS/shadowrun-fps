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

    // Parse the request body to get the action
    let body;
    try {
      body = await req.json();
    } catch (error) {
      // Default to clearing all if no action specified
      body = { action: "clear_all" };
    }

    const { action = "clear_all" } = body;

    // Get the team to verify captain
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify user is team captain
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team captains can manage invites" },
        { status: 403 }
      );
    }

    let result;

    // Handle different actions
    if (action === "cancel_pending") {
      // Update all pending invites to cancelled status
      result = await db.collection("TeamInvites").updateMany(
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
        message: "All pending invites have been cancelled",
        affected: result.modifiedCount,
      });
    } else if (action === "delete_completed") {
      // Actually DELETE completed/cancelled invites (not just update status)
      result = await db.collection("TeamInvites").deleteMany({
        teamId: new ObjectId(teamId),
        status: { $in: ["completed", "cancelled", "rejected"] },
      });

      return NextResponse.json({
        success: true,
        message: "All completed invites have been permanently deleted",
        deleted: result.deletedCount,
      });
    } else {
      // Default action: clear all invites
      result = await db.collection("TeamInvites").deleteMany({
        teamId: new ObjectId(teamId),
      });

      return NextResponse.json({
        success: true,
        message: "All team invites have been permanently deleted",
        deleted: result.deletedCount,
      });
    }
  } catch (error) {
    console.error("Error managing team invites:", error);
    return NextResponse.json(
      { error: "Failed to manage team invites" },
      { status: 500 }
    );
  }
}
