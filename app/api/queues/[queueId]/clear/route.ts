import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to clear a queue" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!isAdmin(session.user.id)) {
      console.log("Admin check failed in clear route:", {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "You don't have permission to clear queues" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Clear all players from the queue
    const result = await db
      .collection("Queues")
      .updateOne(
        { _id: new ObjectId(params.queueId) },
        { $set: { players: [] } }
      );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to clear queue" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Queue cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing queue:", error);
    return NextResponse.json(
      { error: "Failed to clear queue" },
      { status: 500 }
    );
  }
}
