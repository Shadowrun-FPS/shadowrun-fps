import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Fetch moderation logs
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'all', 'warnings', 'bans', 'active', etc.
    const limit = Number(searchParams.get("limit") || "50");
    const skip = Number(searchParams.get("skip") || "0");
    const search = searchParams.get("search") || "";

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("moderation_logs");

    let query: any = {};

    // Filter by type if specified
    if (type) {
      if (type === "active") {
        query = {
          action: "ban",
          $or: [{ expiry: { $gt: new Date() } }, { duration: "Permanent" }],
        };
      } else if (type === "warnings") {
        query = { action: "warning" };
      } else if (type === "disputes") {
        query = { hasDispute: true };
      } else if (type !== "all") {
        query = { action: type };
      }
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { playerName: { $regex: search, $options: "i" } },
        { reason: { $regex: search, $options: "i" } },
        { moderatorName: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated results
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Calculate accurate statistics first
    const warningsCount = await collection.countDocuments({
      action: "warning",
    });

    const activeBansCount = await collection.countDocuments({
      action: "ban",
      $or: [{ expiry: { $gt: new Date() } }, { duration: "Permanent" }],
    });

    const totalActionsCount = await collection.countDocuments({});

    // Get month-over-month change by comparing to last month
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const warningsLastMonth = await collection.countDocuments({
      action: "warning",
      timestamp: { $lt: lastMonthDate },
    });

    const activeBansLastMonth = await collection.countDocuments({
      action: "ban",
      $or: [{ expiry: { $gt: lastMonthDate } }, { duration: "Permanent" }],
      timestamp: { $lt: lastMonthDate },
    });

    const totalActionsLastMonth = await collection.countDocuments({
      timestamp: { $lt: lastMonthDate },
    });

    // Calculate change (current - lastMonth)
    const warningsChange = warningsCount - warningsLastMonth;
    const activeBansChange = activeBansCount - activeBansLastMonth;
    const totalActionsChange = totalActionsCount - totalActionsLastMonth;

    // Build stats object
    const stats = {
      warnings: {
        current: warningsCount,
        change: warningsChange,
      },
      activeBans: {
        current: activeBansCount,
        change: activeBansChange,
      },
      totalActions: {
        current: totalActionsCount,
        change: totalActionsChange,
      },
    };

    // For public logs, remove moderator information and ensure player names are available for blurring
    const isAdmin =
      session?.user?.roles?.includes("admin") ||
      session?.user?.roles?.includes("moderator");

    const formattedLogs = logs.map((log) => {
      if (!isAdmin) {
        // For public logs, include only necessary fields
        return {
          _id: log._id,
          action: log.action,
          playerName: log.playerName,
          reason: log.reason,
          duration: log.duration,
          timestamp: log.timestamp,
          expiry: log.expiry,
        };
      }
      return log;
    });

    return NextResponse.json({
      logs: formattedLogs,
      total,
      stats: isAdmin ? stats : undefined,
    });
  } catch (error) {
    console.error("Failed to fetch moderation logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch moderation logs" },
      { status: 500 }
    );
  }
}

// Create a new moderation log entry
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user has permission to create moderation logs
    if (
      !session?.user?.roles?.includes("admin") &&
      !session?.user?.roles?.includes("moderator")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      type,
      playerId,
      playerName,
      reason,
      duration,
      active = true,
    } = body;

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("moderation_logs");

    const newLog = {
      type,
      playerId,
      playerName,
      reason,
      duration,
      active,
      moderatorId: session.user.id,
      moderatorName: session.user.name,
      timestamp: new Date(),
      hasDispute: false,
    };

    const result = await collection.insertOne(newLog);

    return NextResponse.json({
      success: true,
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Failed to create moderation log:", error);
    return NextResponse.json(
      { error: "Failed to create moderation log" },
      { status: 500 }
    );
  }
}
