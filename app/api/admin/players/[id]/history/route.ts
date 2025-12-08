import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

// Define interfaces for the player history types
interface Warning {
  id: string;
  timestamp: string;
  reason: string;
  moderatorId: string;
  moderatorName: string;
}

interface Ban {
  id: string;
  timestamp: string;
  reason: string;
  duration: string;
  expiry: string;
  active: boolean;
  moderatorId: string;
  moderatorName: string;
}

interface HistoryItem {
  type: string;
  data: Warning | Ban;
  timestamp: string;
}

async function getPlayerHistoryHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const playerId = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(playerId)) {
    return NextResponse.json(
      { error: "Invalid player ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const player = await db
    .collection("Players")
    .findOne({ _id: new ObjectId(playerId) });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Use proper typing for the history array
    const history: HistoryItem[] = [];

    if (player.warnings) {
      player.warnings.forEach((warning: Warning) => {
        history.push({
          type: "warning",
          data: warning,
          timestamp: warning.timestamp,
        });
      });
    }

    if (player.bans) {
      player.bans.forEach((ban: Ban) => {
        history.push({
          type: "ban",
          data: ban,
          timestamp: ban.timestamp,
        });
      });
    }

    history.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const response = NextResponse.json({ history });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
}

export const GET = withApiSecurity(getPlayerHistoryHandler, {
  rateLimiter: "admin",
  requireAuth: true,
});
