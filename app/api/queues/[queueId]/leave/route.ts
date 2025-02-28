import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId } from "mongodb";
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

    // Remove player from queue
    const result = await db.collection<Queue>("Queues").updateOne(
      { _id: new ObjectId(params.queueId) },
      {
        $pull: {
          players: { discordId: session.user.id },
        } as any, // Type assertion needed due to MongoDB types limitation
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to leave queue" },
        { status: 400 }
      );
    }

    // Always return a JSON response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to leave queue:", error);
    return NextResponse.json(
      { error: "Failed to leave queue" },
      { status: 500 }
    );
  }
}
