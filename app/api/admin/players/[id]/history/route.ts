import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check if user has required roles
    const isAuthorized =
      session?.user?.id === "238329746671271936" || // Your ID
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("moderator") ||
          session?.user?.roles.includes("founder")));

    if (!session?.user || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Get player document
    const player = await db
      .collection("Players")
      .findOne({ _id: new ObjectId(params.id) });

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

    // Sort history by timestamp
    history.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      history,
    });
  } catch (error) {
    console.error("Error fetching player history:", error);
    return NextResponse.json(
      { error: "Failed to fetch player history" },
      { status: 500 }
    );
  }
}
