import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog } from "@/lib/security";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getQueuesHandler(req: NextRequest) {
  const { db } = await connectToDatabase();

  const result = await cachedQuery(
    "queues:all",
    async () => {
      return await db.collection("Queues").find({}).toArray();
    },
    30 * 1000 // Cache for 30 seconds (queues change frequently)
  );

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}

export const GET = withApiSecurity(getQueuesHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 30,
});
