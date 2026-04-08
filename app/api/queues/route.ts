import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { enrichQueueDocumentsWithRoleNames } from "@/lib/enrich-queue-documents-role-names";
import { cachedQuery } from "@/lib/query-cache";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getQueuesHandler(req: NextRequest) {
  const { db } = await connectToDatabase();

  // Returns queue documents; adds requiredRoleNames from DB when fresh, else Discord map (cached 5m).
  const result = await cachedQuery(
    "queues:all",
    async () => {
      const queues = await db.collection("Queues").find({}).toArray();
      return enrichQueueDocumentsWithRoleNames(queues, db);
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
