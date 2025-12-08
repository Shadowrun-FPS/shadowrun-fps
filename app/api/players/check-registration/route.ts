import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

// Add this line to explicitly mark the route as dynamic
export const dynamic = "force-dynamic";

async function getCheckRegistrationHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to check registration" },
      { status: 401 }
    );
  }

  const userId = sanitizeString(session.user.id, 50);
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const player = await db.collection("Players").findOne({
    discordId: userId,
  });

  const response = NextResponse.json({
    isRegistered: !!player,
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getCheckRegistrationHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
