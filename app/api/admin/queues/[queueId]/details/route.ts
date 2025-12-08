import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

const DEVELOPER_DISCORD_ID = "238329746671271936";

async function patchQueueDetailsHandler(
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
      { error: "Invalid queue ID" },
      { status: 400 }
    );
  }

  const isDeveloper =
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
    session.user.id === DEVELOPER_DISCORD_ID;
  const isAdmin = session.user.roles?.includes("admin") || session.user.isAdmin;
  const isFounder = session.user.roles?.includes("founder");

  if (!isDeveloper && !isAdmin && !isFounder) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    gameType: { type: "string", required: true, maxLength: 50 },
    eloTier: { type: "string", required: true, maxLength: 50 },
    minElo: { type: "number", required: false, min: 0, max: 10000 },
    maxElo: { type: "number", required: false, min: 0, max: 10000 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { gameType, eloTier, minElo, maxElo } = validation.data! as {
    gameType: string;
    eloTier: string;
    minElo?: number;
    maxElo?: number;
  };

    if (minElo !== undefined && maxElo !== undefined) {
      if (minElo >= maxElo) {
        return NextResponse.json(
          { error: "minElo must be less than maxElo" },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();
    
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Update the queue
    const updateData: any = {
      $set: {
        gameType,
        eloTier,
      },
    };

    if (minElo !== undefined) {
      updateData.$set.minElo = minElo;
    }
    if (maxElo !== undefined) {
      updateData.$set.maxElo = maxElo;
    }

    await db.collection("Queues").updateOne(
      { _id: new ObjectId(queueId) },
      updateData
    );

    revalidatePath("/admin/queues");
    revalidatePath(`/admin/queues/${queueId}`);

    return NextResponse.json({
      success: true,
      message: "Queue details updated successfully",
    });
}

export const PATCH = withApiSecurity(patchQueueDetailsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  revalidatePaths: ["/admin/queues"],
});

