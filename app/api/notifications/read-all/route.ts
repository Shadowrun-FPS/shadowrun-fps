import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postReadAllNotificationsHandler() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(session.user.id, 50);
  const { db } = await connectToDatabase();

  await db.collection("Notifications").updateMany(
    {
      userId,
      read: false,
    },
    { $set: { read: true, readAt: new Date() } }
  );

  revalidatePath("/notifications");

  return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postReadAllNotificationsHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/notifications"],
});
