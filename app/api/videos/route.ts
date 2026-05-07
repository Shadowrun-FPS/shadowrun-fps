import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getVideosHandler(_request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const videos = await db
      .collection("Videos")
      .find({ isFeatured: "yes" })
      .sort({ tutorialOrder: 1 })
      .toArray();
    return NextResponse.json({
      ok: true,
      results: videos,
      status: 201,
    });
  } catch (error) {
    safeLog.error("GET /api/videos:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Unable to load videos.",
      },
      { status: 500 }
    );
  }
}

export const GET = withApiSecurity(getVideosHandler, {
  rateLimiter: "publicRead",
  cacheable: true,
  cacheMaxAge: 300,
});
