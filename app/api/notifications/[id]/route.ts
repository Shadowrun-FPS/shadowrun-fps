import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function deleteNotificationHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(idParam, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid notification ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Find the notification first to verify ownership
    const notification = await db.collection("Notifications").findOne({
      _id: new ObjectId(id),
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this notification
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete the notification
    const result = await db.collection("Notifications").deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Notification not found or not authorized to delete" },
        { status: 404 }
      );
    }

    revalidatePath("/notifications");

    return NextResponse.json({ success: true });
}

export const DELETE = withApiSecurity(deleteNotificationHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/notifications"],
});
