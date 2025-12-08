import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postDeleteMatchHandler(req: NextRequest) {
  const body = await req.json();
  const validation = validateBody(body, {
    matchId: { type: "string", required: true, maxLength: 200 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Match ID is required" },
      { status: 400 }
    );
  }

  const { matchId } = validation.data! as { matchId: string };
  const sanitizedMatchId = sanitizeString(matchId, 200);

  const { db } = await connectToDatabase();

  const result = await db.collection("Matches").deleteOne({
    matchId: sanitizedMatchId,
  });

  if (result.deletedCount === 0) {
    safeLog.warn("Match not found or already deleted", { matchId: sanitizedMatchId });
    return NextResponse.json(
      { error: "Match not found or already deleted" },
      { status: 404 }
    );
  }

  safeLog.log("Match deleted via admin override", { matchId: sanitizedMatchId });
  revalidatePath("/matches");
  revalidatePath("/admin/matches");

  return NextResponse.json({
    success: true,
    message: "Match deleted successfully",
  });
}

export const POST = withApiSecurity(postDeleteMatchHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches", "/admin/matches"],
});
