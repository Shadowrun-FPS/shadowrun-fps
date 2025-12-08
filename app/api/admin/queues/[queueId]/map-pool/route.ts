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

async function getQueueMapPoolHandler(
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

  const { db } = await connectToDatabase();
  const queue = await db.collection("Queues").findOne({
    _id: new ObjectId(queueId),
  });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      mapPool: queue.mapPool || null,
      queueId: queue.queueId,
      gameType: queue.gameType,
      teamSize: queue.teamSize,
      eloTier: queue.eloTier,
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

async function patchQueueMapPoolHandler(
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
  const { mapPool } = body;

    // Validate mapPool is an array of map objects or variant IDs (for backward compatibility)
    if (mapPool !== null && !Array.isArray(mapPool)) {
      return NextResponse.json(
        { error: "mapPool must be an array or null" },
        { status: 400 }
      );
    }

    // Validate map objects if provided
    if (mapPool && Array.isArray(mapPool) && mapPool.length > 0) {
      const firstItem = mapPool[0];
      // If it's an object, validate structure
      if (typeof firstItem === "object" && firstItem !== null) {
        if (!firstItem._id || !firstItem.name || !firstItem.src || firstItem.isSmall === undefined) {
          return NextResponse.json(
            { error: "mapPool objects must have _id, name, src, gameMode, and isSmall properties" },
            { status: 400 }
          );
        }
      }
    }

    const { db } = await connectToDatabase();
    
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Update the queue with the new map pool
    // If mapPool is null, remove the field (use default behavior)
    const updateData: any = {};
    if (mapPool === null) {
      updateData.$unset = { mapPool: "" };
    } else {
      updateData.$set = { mapPool };
    }

    await db.collection("Queues").updateOne(
      { _id: new ObjectId(queueId) },
      updateData
    );

    const updatedQueue = await db.collection("Queues").findOne({
      _id: new ObjectId(queueId),
    });

    revalidatePath("/admin/queues");
    revalidatePath(`/admin/queues/${queueId}`);

    return NextResponse.json({
      success: true,
      message: "Queue map pool updated successfully",
      mapPool: updatedQueue?.mapPool || mapPool,
    });
}

export const GET = withApiSecurity(getQueueMapPoolHandler, {
  rateLimiter: "admin",
  requireAuth: true,
});

export const PATCH = withApiSecurity(patchQueueMapPoolHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  revalidatePaths: ["/admin/queues"],
});

