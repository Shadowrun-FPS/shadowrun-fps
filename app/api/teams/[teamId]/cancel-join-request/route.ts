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

    const userId = session.user.id;
    const { db } = await connectToDatabase();
    const teamId = params.teamId;

    // Find the join request
    const joinRequest = await db.collection("TeamJoinRequests").findOne({
      teamId: teamId,
      userId: userId,
      status: "pending",
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "No pending join request found" },
        { status: 404 }
      );
    }

    // Update the join request status to cancelled
    await db.collection("TeamJoinRequests").updateOne(
      { _id: joinRequest._id },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      }
    );

    // Delete the notification for the team captain
    await db.collection("Notifications").deleteMany({
      "metadata.teamId": teamId,
      "metadata.requesterId": userId,
      type: "team_join_request",
    });

    return NextResponse.json({
      success: true,
      message: "Join request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling join request:", error);
    return NextResponse.json(
      { error: "Failed to cancel join request" },
      { status: 500 }
    );
  }
}
