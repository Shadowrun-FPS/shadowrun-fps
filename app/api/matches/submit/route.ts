import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  validateMatchResult,
  validateMatchSubmission,
} from "@/lib/matchValidation";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postSubmitMatchHandler(req: NextRequest) {
  const matchResult = await req.json();
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const resultValidation = validateMatchResult(matchResult, 4);
  if (!resultValidation.isValid) {
    return NextResponse.json(
      { error: resultValidation.error },
      { status: 400 }
    );
  }

  const submissionValidation = validateMatchSubmission(
    matchResult,
    matchResult.team1Players
  );
  if (!submissionValidation.isValid) {
    return NextResponse.json(
      { error: submissionValidation.error },
      { status: 400 }
    );
  }

  const result = await db.collection("Matches").insertOne({
    ...matchResult,
    status: "pending",
    createdAt: new Date(),
  });

  revalidatePath("/matches");

  return NextResponse.json({ matchId: result.insertedId });
}

export const POST = withApiSecurity(postSubmitMatchHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches"],
});
