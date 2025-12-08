import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, WithId, Filter, UpdateFilter } from "mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

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

async function postLeaveHandler(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queueId = sanitizeString(params.queueId, 50);
  if (!ObjectId.isValid(queueId)) {
    return NextResponse.json(
      { error: "Invalid queue ID format" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const filter: Filter<Queue> = { _id: new ObjectId(queueId) };
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

    revalidatePath("/matches/queues");
    revalidatePath("/admin/queues");

    return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postLeaveHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
