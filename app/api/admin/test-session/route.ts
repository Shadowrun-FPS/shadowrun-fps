import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getTestSessionHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = NextResponse.json({
    message: "Session information",
    user: {
      id: sanitizeString(session.user.id, 50),
      name: sanitizeString(session.user.name || "", 100),
      email: session.user.email ? sanitizeString(session.user.email, 255) : null,
      roles: Array.isArray(session.user.roles)
        ? session.user.roles.map((r) => sanitizeString(r, 50))
        : [],
      isAdmin: session.user.isAdmin || false,
    },
    idCheck: {
      exactMatch: session.user.id === SECURITY_CONFIG.DEVELOPER_ID,
      stringMatch:
        session.user.id.toString() === SECURITY_CONFIG.DEVELOPER_ID,
      idType: typeof session.user.id,
    },
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  return response;
}

export const GET = withApiSecurity(getTestSessionHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
