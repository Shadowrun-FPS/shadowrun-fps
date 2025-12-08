import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getQueueTypesHandler() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const types = await db.collection("Queues").distinct("gameType");

  const response = NextResponse.json({ types });
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  return response;
}

export const GET = withApiSecurity(getQueueTypesHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 3600,
});
