import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getNotificationsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(sanitizeString(searchParams.get("page") || "1", 10), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(sanitizeString(searchParams.get("limit") || "50", 10), 10) || 50));
  const skip = (page - 1) * limit;

  const notifications = await db
    .collection("Notifications")
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const totalCount = await db
    .collection("Notifications")
    .countDocuments({ userId: session.user.id });

  return NextResponse.json(
    {
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + notifications.length < totalCount,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}

export const GET = withApiSecurity(getNotificationsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});

async function patchNotificationsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const notificationIds = Array.isArray(body.notificationIds) 
    ? body.notificationIds.map((id: string) => sanitizeString(String(id), 50))
    : [];

  if (notificationIds.length === 0) {
    return NextResponse.json(
      { error: "Notification IDs are required" },
      { status: 400 }
    );
  }

  // Validate ObjectIds
  const validIds = notificationIds.filter((id: string) => ObjectId.isValid(id));
  if (validIds.length === 0) {
    return NextResponse.json(
      { error: "Invalid notification IDs" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  await db.collection("Notifications").updateMany(
    {
      _id: { $in: validIds.map((id: string) => new ObjectId(id)) },
      userId: session.user.id,
    },
    { $set: { read: true, readAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}

export const PATCH = withApiSecurity(patchNotificationsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
