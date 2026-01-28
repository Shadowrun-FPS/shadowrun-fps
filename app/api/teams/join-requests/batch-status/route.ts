import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";

async function postBatchStatusHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateBody(body, {
    requests: {
      type: "array",
      required: true,
      min: 1,
      max: 50, // Limit batch size
    },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid request" },
      { status: 400 }
    );
  }

  const { requests } = validation.data! as {
    requests: Array<{ teamId: string; requestId: string }>;
  };

  if (!Array.isArray(requests) || requests.length < 1 || requests.length > 50) {
    return NextResponse.json(
      { error: "requests must be an array with 1 to 50 items" },
      { status: 400 }
    );
  }

  // Sanitize and validate all IDs
  const validRequests = requests
    .map((req) => ({
      teamId: sanitizeString(req.teamId, 50),
      requestId: sanitizeString(req.requestId, 50),
    }))
    .filter(
      (req) => ObjectId.isValid(req.teamId) && ObjectId.isValid(req.requestId)
    );

  if (validRequests.length === 0) {
    return NextResponse.json(
      { error: "No valid request IDs provided" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  // Batch fetch all join requests in one query
  const requestIds = validRequests.map((req) => new ObjectId(req.requestId));
  const joinRequests = await db
    .collection("TeamJoinRequests")
    .find({
      _id: { $in: requestIds },
    })
    .toArray();

  // Build response map: "teamId-requestId" -> status
  const statusMap: Record<string, string> = {};
  joinRequests.forEach((jr) => {
    const key = `${jr.teamId}-${jr._id.toString()}`;
    statusMap[key] = jr.status || "pending";
  });

  // Fill in "not_found" for any that weren't found
  validRequests.forEach((req) => {
    const key = `${req.teamId}-${req.requestId}`;
    if (!statusMap[key]) {
      statusMap[key] = "not_found";
    }
  });

  return NextResponse.json(
    { statuses: statusMap },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}

export const POST = withApiSecurity(postBatchStatusHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
