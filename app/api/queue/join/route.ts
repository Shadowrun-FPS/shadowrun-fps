import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isPlayerBanned } from "@/lib/ban-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body only once at the beginning
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    // Get queue ID from the request body
    const queueId = body.queueId;
    console.log("[QUEUE-JOIN] Request:", { queueId, userId: session.user.id });

    // Check if player is banned using the centralized utility
    const banStatus = await isPlayerBanned(session.user.id);

    if (banStatus.isBanned) {
      console.log("[QUEUE-JOIN] Rejected - player is banned:", session.user.id);
      return NextResponse.json(
        {
          error: "Unable to join queue",
          message: banStatus.message,
        },
        { status: 403 }
      );
    }

    // Player is not banned, proceed with queue join logic
    console.log("[QUEUE-JOIN] Player allowed to join queue:", {
      discordId: session.user.id,
      queueId,
    });

    // Queue join logic goes here
    // ...

    return NextResponse.json({
      success: true,
      message: "Joined queue successfully",
    });
  } catch (error) {
    console.error("[QUEUE-JOIN] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
