import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getMapsHandler(request: NextRequest) {
  const client = await clientPromise;
  const db = client.db();

  const maps = await db.collection("Maps").find({}).toArray();

  const transformedMaps = maps.map((map) => ({
    ...map,
    _id: map._id.toString(),
  }));

  const response = NextResponse.json(transformedMaps);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  return response;
}

export const GET = withApiSecurity(getMapsHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 3600,
});
