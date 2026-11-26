import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { withApiSecurity } from "@/lib/api-wrapper";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { sanitizeRivalsPreference } from "@/lib/rivals/preferences";
import { safeLog, sanitizeString } from "@/lib/security";

export const dynamic = "force-dynamic";

async function patchRivalsPreference(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const preference = sanitizeRivalsPreference(body);
  if (!preference) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const result = await db.collection("Players").updateOne(
      { discordId: sanitizeString(session.user.id, 50) },
      { $set: { rivalsPreference: preference, updatedAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Could not save that preference." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    safeLog.error("Failed to save rivals preference:", error);
    return NextResponse.json(
      { error: "Could not save that preference." },
      { status: 500 },
    );
  }
}

export const PATCH = withApiSecurity(patchRivalsPreference, {
  requireAuth: true,
  rateLimiter: "api",
});
