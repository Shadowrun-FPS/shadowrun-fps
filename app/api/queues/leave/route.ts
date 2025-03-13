import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { queueId, discordId } = await request.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Remove player from players array using type assertion to fix TypeScript error
    const result1 = await db.collection("Queues").updateOne(
      { _id: new ObjectId(queueId) },
      {
        $pull: {
          players: { discordId },
        },
      } as any // Type assertion to bypass TypeScript error
    );

    // Remove player from waitlist array if needed
    const result2 = await db.collection("Queues").updateOne(
      { _id: new ObjectId(queueId) },
      {
        $pull: {
          waitlist: { discordId },
        },
      } as any // Type assertion to bypass TypeScript error
    );

    if (result1.modifiedCount === 0 && result2.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to leave queue" },
        { status: 500 }
      );
    }

    // Get updated queue data
    const updatedQueue = await db
      .collection("Queues")
      .findOne({ _id: new ObjectId(queueId) });

    // Get all queues to update the UI
    const allQueues = await db.collection("Queues").find({}).toArray();

    return NextResponse.json({
      success: true,
      message: "Left queue successfully",
      queue: updatedQueue,
      allQueues,
    });
  } catch (error) {
    console.error("Error leaving queue:", error);
    return NextResponse.json(
      { error: "Failed to leave queue" },
      { status: 500 }
    );
  }
}
