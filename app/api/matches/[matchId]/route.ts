import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function getMatchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId: matchIdParam } = await params;
  const matchId = sanitizeString(matchIdParam, 100);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const match = await db.collection("Matches").findOne({
    matchId,
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const response = NextResponse.json(match);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=1800"
  );
  return response;
}

export const GET = withApiSecurity(getMatchHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});

async function deleteMatchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId: matchIdParam } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to delete a match" },
      { status: 401 }
    );
  }

  const matchId = sanitizeString(matchIdParam, 100);

  const isYourAccount = session.user.id === SECURITY_CONFIG.DEVELOPER_ID;

  const hasRequiredRole =
    isYourAccount ||
    (session.user.roles &&
      (session.user.roles.includes("admin") ||
        session.user.roles.includes("moderator") ||
        session.user.roles.includes("founder")));

  if (!hasRequiredRole) {
    return NextResponse.json(
      { error: "You don't have permission to delete matches" },
      { status: 403 }
    );
  }

  const { db } = await connectToDatabase();

  const result = await db.collection("Matches").deleteOne({
    matchId,
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);

  return NextResponse.json({
    success: true,
    message: "Match deleted successfully",
  });
}

export const DELETE = withApiSecurity(deleteMatchHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches", "/matches/[matchId]"],
});
