import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, rateLimiters, getClientIdentifier, sanitizeString } from "@/lib/security";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const session = await getServerSession(authOptions);
    const identifier = getClientIdentifier(request, session?.user?.id);
    if (!rateLimiters.admin.isAllowed(identifier)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin or moderator role
    const isAdmin = session.user.roles?.includes("admin");
    const isModerator = session.user.roles?.includes("moderator");
    const isSpecificUser = session.user.id === SECURITY_CONFIG.DEVELOPER_ID;

    if (!isAdmin && !isModerator && !isSpecificUser) {
      return NextResponse.json(
        { error: "You don't have permission to warn players" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const playerId = sanitizeString(body.playerId || "", 50);
    const playerName = sanitizeString(body.playerName || "", 100);
    const reason = sanitizeString(body.reason || "", 1000);
    const ruleId = body.ruleId ? sanitizeString(String(body.ruleId), 50) : null;

    // Validate required fields
    if (!playerId || !reason) {
      return NextResponse.json(
        { error: "Player ID and reason are required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(playerId)) {
      return NextResponse.json(
        { error: "Invalid player ID format" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get moderator details
    const moderator = await db.collection("Players").findOne({
      discordId: session.user.id,
    });

    const moderatorName =
      moderator?.discordNickname ||
      moderator?.discordUsername ||
      session.user.name;

    // Create warning log
    const warningLog = {
      playerId: new ObjectId(playerId),
      moderatorId: session.user.id,
      playerName: sanitizeString(playerName, 100),
      moderatorName: sanitizeString(moderatorName, 100),
      action: "warn",
      reason: sanitizeString(reason, 1000),
      ruleId: ruleId && ObjectId.isValid(ruleId) ? new ObjectId(ruleId) : null,
      timestamp: new Date(),
    };

    await db.collection("moderation_logs").insertOne(warningLog);

    // Revalidate relevant paths
    revalidatePath("/admin/moderation");
    revalidatePath("/moderation-log");
    revalidatePath(`/player/${playerId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    safeLog.error("Error warning player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
