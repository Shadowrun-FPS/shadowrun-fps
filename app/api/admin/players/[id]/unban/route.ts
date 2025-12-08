import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createModerationLog } from "@/lib/moderation";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

// Add interface for the request body at the top of the file
interface UnbanRequest {
  reason?: string;
}

async function postUnbanPlayerHandler(
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

  const data: UnbanRequest = await req.json();
  const validation = validateBody(data, {
    reason: { type: "string", required: false, maxLength: 1000 },
  });

  const reason = validation.valid && validation.data?.reason && typeof validation.data.reason === "string"
    ? sanitizeString(validation.data.reason, 1000)
    : "Ban canceled by administrator";

    const { db } = await connectToDatabase();

    const moderator = await db.collection("Players").findOne({
      discordId: sanitizeString(session.user.id, 50),
    });

    const moderatorNickname = sanitizeString(
      moderator?.discordNickname || session.user.name || "",
      100
    );

    const player = await db.collection("Players").findOne({
      _id: new ObjectId(playerId),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    await db.collection("Players").updateOne(
      { _id: new ObjectId(playerId) },
      {
        $set: {
          isBanned: false,
          banExpiry: null,
          updatedAt: new Date(),
        },
      }
    );

    await createModerationLog({
      playerId: playerId,
      moderatorId: sanitizeString(session.user.id, 50),
      playerName: sanitizeString(
        player?.discordNickname || player?.discordUsername || "Unknown Player",
        100
      ),
      moderatorName: moderatorNickname || "Unknown Moderator",
      action: "unban",
      reason: reason,
      timestamp: new Date(),
    });

    revalidatePath("/admin/players");
    revalidatePath(`/admin/players/${playerId}`);

    return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postUnbanPlayerHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/players"],
});
