import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { db } = await connectToDatabase();

    const notifications = await db
      .collection("Notifications")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(
      `Found ${notifications.length} notifications for user ${session.user.id}`
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { notificationIds } = await req.json();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Mark notifications as read
    await db.collection("Notifications").updateMany(
      {
        _id: { $in: notificationIds.map((id: string) => new ObjectId(id)) },
        userId: session.user.id,
      },
      { $set: { read: true, readAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
