import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId, Filter, UpdateFilter } from "mongodb";
import { authOptions } from "@/lib/auth";

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number;
}

interface Queue extends WithId<Document> {
  _id: ObjectId;
  status: string;
  players: QueuePlayer[];
  teamSize: number;
}

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Remove player from queue using proper typing
    const filter: Filter<Queue> = { _id: new ObjectId(params.queueId) };
    const update = {
      $pull: {
        players: { discordId: session.user.id },
      },
    };

    const result = await db
      .collection<Queue>("Queues")
      .updateOne(filter, update as any); // Using any here to bypass the strict type checking while maintaining functionality

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to leave queue or player not in queue" },
        { status: 400 }
      );
    }

    // Fetch updated queues to broadcast
    const updatedQueues = await db.collection("Queues").find({}).toArray();

    // Emit the update event to all connected clients
    if (global.io) {
      global.io.emit("queues:update", updatedQueues);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving queue:", error);
    return NextResponse.json(
      { error: "Failed to leave queue" },
      { status: 500 }
    );
  }
}
