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
    teamSize: { type: "number", required: false, min: 1, max: 8 },
    eloTier: { type: "string", required: false, maxLength: 50 },
    minElo: { type: "number", required: false, min: 0, max: 10000 },
    maxElo: { type: "number", required: false, min: 0, max: 10000 },
    requiredRoles: { type: "array", required: false },
    customQueueChannel: { type: "string", required: false, maxLength: 50 },
    customMatchChannel: { type: "string", required: false, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const {
    gameType,
    teamSize,
    eloTier,
    minElo,
    maxElo,
    requiredRoles,
    customQueueChannel,
    customMatchChannel,
  } = validation.data! as {
    gameType: string;
    teamSize?: number;
    eloTier?: string;
    minElo?: number;
    maxElo?: number;
    requiredRoles?: string[];
    customQueueChannel?: string;
    customMatchChannel?: string;
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
        updatedAt: new Date(),
      },
    };

    if (teamSize !== undefined) {
      updateData.$set.teamSize = teamSize;
    }
    if (eloTier !== undefined) {
      updateData.$set.eloTier = eloTier;
    } else {
      updateData.$unset = { eloTier: "" };
    }
    if (minElo !== undefined) {
      updateData.$set.minElo = minElo;
    }
    if (maxElo !== undefined) {
      updateData.$set.maxElo = maxElo;
    }
    if (requiredRoles !== undefined) {
      updateData.$set.requiredRoles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [];
    }
    if (customQueueChannel !== undefined) {
      if (customQueueChannel) {
        updateData.$set.customQueueChannel = customQueueChannel;
      } else {
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.customQueueChannel = "";
      }
    }
    if (customMatchChannel !== undefined) {
      if (customMatchChannel) {
        updateData.$set.customMatchChannel = customMatchChannel;
      } else {
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.customMatchChannel = "";
      }
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

