import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postJoinQueueHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(body, {
    queueId: { type: "string", required: true, maxLength: 50 },
    player: { type: "object", required: true },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { queueId, player } = validation.data! as {
    queueId: string;
    player: { discordId: string; elo?: number };
  };

  const sanitizedQueueId = sanitizeString(queueId, 50);
  if (!ObjectId.isValid(sanitizedQueueId)) {
    return NextResponse.json(
      { error: "Invalid queue ID" },
      { status: 400 }
    );
  }

  const sanitizedPlayerId = sanitizeString(player.discordId, 50);
  if (sanitizedPlayerId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only join queues for yourself" },
      { status: 403 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const existingQueue = await db.collection("Queues").findOne({
    "players.discordId": sanitizedPlayerId,
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

    const playerData = {
      discordId: sanitizedPlayerId,
      joinedAt: Date.now(),
      elo: typeof player.elo === "number" ? Math.max(0, Math.min(10000, player.elo)) : 1500,
    };

    const result = await db
      .collection("Queues")
      .updateOne(
        { _id: new ObjectId(sanitizedQueueId) },
        { $push: { players: playerData } as any }
      );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to join queue" },
        { status: 500 }
      );
    }

    const updatedQueue = await db
      .collection("Queues")
      .findOne({ _id: new ObjectId(sanitizedQueueId) });

    const allQueues = await db.collection("Queues").find({}).toArray();

    revalidatePath("/matches/queues");
    revalidatePath("/admin/queues");

    return NextResponse.json({
      success: true,
      message: "Joined queue successfully",
      queue: updatedQueue,
      allQueues,
    });
}

export const POST = withApiSecurity(postJoinQueueHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
