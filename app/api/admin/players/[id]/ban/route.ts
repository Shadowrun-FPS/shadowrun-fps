import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";
import { createModerationLog } from "@/lib/moderation";
import {
  ADMIN_ROLE_IDS,
  MODERATOR_ROLE_IDS,
  SECURITY_CONFIG,
} from "@/lib/security-config";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

// Define types for your ban object
interface BanRecord {
  reason: string;
  ruleId: string | null;
  moderatorId: string;
  moderatorName: string | null | undefined;
  moderatorNickname: string | undefined;
  duration: string | number;
  expiry: Date | null;
  timestamp: Date;
}

// Define interface for the Player document
interface Player {
  _id: ObjectId;
  bans: BanRecord[];
  isBanned: boolean;
  banExpiry: Date | null;
  updatedAt: Date;
  // other necessary fields...
}

async function postBanPlayerHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const playerId = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(playerId)) {
    return NextResponse.json(
      { error: "Invalid player ID" },
      { status: 400 }
    );
  }

  const ban = await req.json();
  const validation = validateBody(ban, {
    reason: { type: "string", required: true, maxLength: 1000 },
    ruleId: { type: "string", required: false, maxLength: 50 },
    duration: {
      type: "string",
      required: true,
      pattern: /^(permanent|24h|3d|7d|30d)$/,
    },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { reason, ruleId, duration } = validation.data! as {
    reason: string;
    ruleId?: string;
    duration: string;
  };

  const sanitizedReason = sanitizeString(reason, 1000);
  const sanitizedRuleId = ruleId ? sanitizeString(ruleId, 50) : null;

    let banExpiry = null;

    if (duration !== "permanent") {
      const now = new Date();
      if (duration === "24h") {
        banExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (duration === "3d") {
        banExpiry = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      } else if (duration === "7d") {
        banExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (duration === "30d") {
        banExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    const { db } = await connectToDatabase();

    const moderator = await db.collection("Players").findOne({
      discordId: sanitizeString(session.user.id, 50),
    });

    const moderatorNickname = sanitizeString(
      moderator?.discordNickname || session.user.name || "",
      100
    );

    const playerExists = await db.collection("Players").findOne({
      _id: new ObjectId(playerId),
    });

      if (!playerExists) {
        return NextResponse.json(
          { error: "Player not found" },
          { status: 404 }
        );
      }

      const banRecord: BanRecord = {
        reason: sanitizedReason || "No reason provided",
        ruleId: sanitizedRuleId || null,
        moderatorId: sanitizeString(session.user.id, 50),
        moderatorName: sanitizeString(session.user.name || "", 100),
        moderatorNickname: sanitizeString(session.user.nickname || "", 100),
        duration: sanitizeString(duration, 20),
        expiry: banExpiry,
        timestamp: new Date(),
      };

      const updateDoc = {
        $push: { bans: banRecord },
        $set: {
          isBanned: true,
          banExpiry: banExpiry,
          // Don't update updatedAt - it's used for "Last Active" timestamp
        },
      };

      const typedUpdateDoc = updateDoc as unknown as UpdateFilter<Document>;

      const result = await db
        .collection("Players")
        .updateOne({ _id: new ObjectId(playerId) }, typedUpdateDoc);

      await createModerationLog({
        playerId: playerId,
        moderatorId: sanitizeString(session.user.id, 50),
        playerName: sanitizeString(
          playerExists.discordNickname || playerExists.discordUsername || "",
          100
        ),
        moderatorName: moderatorNickname,
        action: "ban",
        reason: sanitizedReason || "No reason provided",
        ruleId: sanitizedRuleId || null,
        duration: sanitizeString(duration, 20) || "24h",
        expiry: banExpiry,
        timestamp: new Date(),
      });

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: "Failed to update player record" },
          { status: 500 }
        );
      }

      revalidatePath("/admin/players");
      revalidatePath(`/admin/players/${playerId}`);

      return NextResponse.json({ success: true, ban: { reason: sanitizedReason, ruleId: sanitizedRuleId, duration } });
}

export const POST = withApiSecurity(postBanPlayerHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/players"],
});
