import { NextRequest, NextResponse } from "next/server";

import { withApiSecurity } from "@/lib/api-wrapper";
import { getLeaderboardOrThrow } from "@/lib/leaderboard";
import { safeLog } from "@/lib/security";

// Force-dynamic: ranked snapshot is proxied live with a short in-memory TTL.
export const dynamic = "force-dynamic";

async function getLeaderboardHandler(_request: NextRequest) {
  try {
    const payload = await getLeaderboardOrThrow();
    return NextResponse.json(payload);
  } catch (error) {
    safeLog.error("Leaderboard proxy failed:", error);
    return NextResponse.json(
      { error: "Leaderboard is temporarily unavailable." },
      { status: 502 },
    );
  }
}

export const GET = withApiSecurity(getLeaderboardHandler, {
  rateLimiter: "publicRead",
  cacheable: true,
  cacheMaxAge: 60,
});
