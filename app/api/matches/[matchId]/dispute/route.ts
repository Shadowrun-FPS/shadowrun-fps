import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postDisputeMatchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId: matchIdParam } = await params;
  const matchId = sanitizeString(matchIdParam, 100);
  if (!ObjectId.isValid(matchId)) {
    return NextResponse.json(
      { error: "Invalid match ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    disputerId: { type: "string", required: true, maxLength: 50 },
    reason: { type: "string", required: true, maxLength: 1000 },
    evidence: { type: "string", required: false, maxLength: 5000 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { disputerId, reason, evidence } = validation.data! as {
    disputerId: string;
    reason: string;
    evidence?: string;
  };

  const sanitizedDisputerId = sanitizeString(disputerId, 50);
  const sanitizedReason = sanitizeString(reason, 1000);
  const sanitizedEvidence = evidence ? sanitizeString(evidence, 5000) : null;

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  await db.collection("Disputes").insertOne({
    matchId: new ObjectId(matchId),
    disputerId: sanitizedDisputerId,
    reason: sanitizedReason,
    evidence: sanitizedEvidence,
    status: "open",
    createdAt: new Date(),
    resolution: null,
    resolvedBy: null,
    resolvedAt: null,
  });

  await db.collection("Matches").updateOne(
    { _id: new ObjectId(matchId) },
    {
      $set: {
        status: "disputed",
        disputeDetails: {
          disputerId: sanitizedDisputerId,
          reason: sanitizedReason,
          timestamp: new Date(),
        },
      },
    }
  );

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);

  return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postDisputeMatchHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches"],
});
