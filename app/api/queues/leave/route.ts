import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postLeaveQueueHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(body, {
    queueId: { type: "string", required: true, maxLength: 50 },
    discordId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { queueId, discordId } = validation.data! as {
    queueId: string;
    discordId: string;
  };

  const sanitizedQueueId = sanitizeString(queueId, 50);
  const sanitizedDiscordId = sanitizeString(discordId, 50);

  if (!ObjectId.isValid(sanitizedQueueId)) {
    return NextResponse.json(
      { error: "Invalid queue ID" },
      { status: 400 }
    );
  }

  if (sanitizedDiscordId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only leave queues for yourself" },
      { status: 403 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result1 = await db.collection("Queues").updateOne(
    { _id: new ObjectId(sanitizedQueueId) },
    {
      $pull: {
        players: { discordId: sanitizedDiscordId },
      },
    } as any
  );

  const result2 = await db.collection("Queues").updateOne(
    { _id: new ObjectId(sanitizedQueueId) },
    {
      $pull: {
        waitlist: { discordId: sanitizedDiscordId },
      },
    } as any
  );

    if (result1.modifiedCount === 0 && result2.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to leave queue" },
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
      message: "Left queue successfully",
      queue: updatedQueue,
      allQueues,
    });
}

export const POST = withApiSecurity(postLeaveQueueHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
