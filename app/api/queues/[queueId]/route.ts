import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

// DELETE endpoint to delete a queue
export async function DELETE(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins or the specific developer to delete queues
    const isAuthorized =
      session.user.roles?.includes("admin") ||
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Not authorized to delete queues" },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const queueId = params.queueId;

    // Try to find the queue first to verify it exists
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Delete the queue
    await db.collection("Queues").deleteOne({
      _id: new ObjectId(queueId),
    });

    return NextResponse.json({
      success: true,
      message: "Queue deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting queue:", error);
    return NextResponse.json(
      { error: "Failed to delete queue" },
      { status: 500 }
    );
  }
}
