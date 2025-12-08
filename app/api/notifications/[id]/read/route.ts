import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postReadNotificationHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid notification ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Mark notification as read
    const result = await db.collection("Notifications").updateOne(
      {
        _id: new ObjectId(id),
        userId: session.user.id, // Security check
      },
      { $set: { read: true, readAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    revalidatePath("/notifications");

    return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postReadNotificationHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/notifications"],
});
