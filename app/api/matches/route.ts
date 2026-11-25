import { NextRequest, NextResponse } from "next/server";

import { withApiSecurity } from "@/lib/api-wrapper";
import { getRankedMatchesOrThrow } from "@/lib/ranked-matches";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";


async function getMatchesHandler(_request: NextRequest) {
  try {
    const payload = await getRankedMatchesOrThrow();
    return NextResponse.json(payload);
  } catch (error) {
    safeLog.error("Matches proxy failed:", error);
    return NextResponse.json(
      { error: "Matches are temporarily unavailable." },
      { status: 502 },
    );
  }
}

export const GET = withApiSecurity(getMatchesHandler, {
  rateLimiter: "publicRead",
  cacheable: true,
  cacheMaxAge: 60,
});
