import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getNotificationCountHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const response = NextResponse.json({ count: 0 });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const count = await db.collection("Notifications").countDocuments({
    userId,
    read: false,
  });

  const response = NextResponse.json({ count });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getNotificationCountHandler, {
  rateLimiter: "api",
  requireAuth: false,
});
