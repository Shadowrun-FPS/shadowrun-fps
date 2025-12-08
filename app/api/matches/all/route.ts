export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getAllMatchesHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDatabase();

  const matches = await db.collection("Matches").find({}).limit(20).toArray();

  const formattedMatches = matches.map((match) => ({
    ...match,
    id: match._id.toString(),
    _id: undefined,
  }));

  const response = NextResponse.json({
    matches: formattedMatches,
    count: formattedMatches.length,
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getAllMatchesHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
