import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { queueId, player } = await request.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // First check if player is already in any queue
    const existingQueue = await db.collection("Queues").findOne({
      "players.discordId": player.discordId,
    });

    if (existingQueue) {
      return NextResponse.json(
        {
          error: "You are already in a queue",
          queueId: existingQueue._id.toString(),
        },
        { status: 400 }
      );
    }

    // Add player to the specified queue
    const result = await db.collection("Queues").updateOne(
      { _id: new ObjectId(queueId) },
      {
        $push: {
          players: {
            ...player,
            joinedAt: Date.now(),
          },
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to join queue" },
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
      message: "Joined queue successfully",
      queue: updatedQueue,
      allQueues,
    });
  } catch (error) {
    console.error("Error joining queue:", error);
    return NextResponse.json(
      { error: "Failed to join queue" },
      { status: 500 }
    );
  }
}
