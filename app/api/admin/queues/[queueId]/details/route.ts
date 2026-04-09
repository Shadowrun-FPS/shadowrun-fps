import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { containsProfanity } from "@/lib/profanity-filter";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { getCachedGuildRoleNameById } from "@/lib/discord-guild-role-names";
import { normalizeDiscordSnowflakeList } from "@/lib/normalize-discord-snowflake";
import { queryCache } from "@/lib/query-cache";
import { revalidatePath } from "next/cache";
import { triggerQueuesListUpdate } from "@/lib/queues-pusher";

const DEVELOPER_DISCORD_ID = "238329746671271936";

async function patchQueueDetailsHandler(
  req: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { queueId: queueIdParam } = await params;
  const queueId = sanitizeString(queueIdParam, 50);
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
  // TODO(queue-privacy): Add optional `hidePlayerElo` boolean to validateBody + $set below, then
  // expose a toggle in Admin Queues "Edit Queue Details" dialog. Public GET /api/queues already
  // returns full documents, so matchmaking cards will receive the field once it exists on the doc.
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

  const validated = validation.data! as {
    gameType: string;
    teamSize?: number;
    eloTier?: string;
    minElo?: number;
    maxElo?: number;
    requiredRoles?: string[];
    customQueueChannel?: string;
    customMatchChannel?: string;
  };

  const {
    gameType: rawGameType,
    teamSize,
    minElo,
    maxElo,
    requiredRoles,
    customQueueChannel,
    customMatchChannel,
  } = validated;

  const trimmedName = typeof rawGameType === "string" ? rawGameType.trim() : "";
  if (!trimmedName) {
    return NextResponse.json(
      { error: "Queue name is required" },
      { status: 400 }
    );
  }

  const gameType = sanitizeString(trimmedName, 50);
  if (containsProfanity(gameType)) {
    return NextResponse.json(
      { error: "Queue name contains inappropriate language" },
      { status: 400 }
    );
  }

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
    if (Object.prototype.hasOwnProperty.call(validated, "eloTier")) {
      const tierTrim = (validated.eloTier ?? "").trim();
      if (tierTrim) {
        updateData.$set.eloTier = sanitizeString(tierTrim, 50);
      } else {
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.eloTier = "";
      }
    }
    if (minElo !== undefined) {
      updateData.$set.minElo = minElo;
    }
    if (maxElo !== undefined) {
      updateData.$set.maxElo = maxElo;
    }
    if (requiredRoles !== undefined) {
      const raw = Array.isArray(requiredRoles) ? requiredRoles : [];
      const normalizedIds = normalizeDiscordSnowflakeList(raw);
      updateData.$set.requiredRoles = normalizedIds;
      if (normalizedIds.length === 0) {
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.requiredRoleNames = "";
      } else {
        const roleMap = await getCachedGuildRoleNameById(db);
        updateData.$set.requiredRoleNames = normalizedIds.map(
          (rid) => roleMap.get(rid) ?? rid
        );
      }
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

    queryCache.invalidate("queues:all");

    revalidatePath("/admin/queues");
    revalidatePath(`/admin/queues/${queueId}`);
    revalidatePath("/matches/queues");

    triggerQueuesListUpdate();

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

