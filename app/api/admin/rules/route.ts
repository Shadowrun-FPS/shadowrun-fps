import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function getRulesHandler() {
  const { db } = await connectToDatabase();

  const rules = await db.collection("Rules").find({}).toArray();

  const response = NextResponse.json(rules);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  return response;
}

export const GET = withApiSecurity(getRulesHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 3600,
});

async function postRulesHandler(req: Request) {
  const session = await getServerSession(authOptions);

  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const validation = validateBody(data, {
    title: { type: "string", required: true, maxLength: 200 },
    description: { type: "string", required: false, maxLength: 5000 },
    severity: { type: "string", required: false, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { title, description, severity } = validation.data! as {
    title: string;
    description?: string;
    severity?: string;
  };

  const { db } = await connectToDatabase();

  const rule = {
    title: sanitizeString(title, 200),
    description: description ? sanitizeString(description, 5000) : "",
    severity: severity ? sanitizeString(severity, 50) : "medium",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("Rules").insertOne(rule);

  revalidatePath("/admin/rules");
  revalidatePath("/community/rules");

  return NextResponse.json({
    ...rule,
    _id: result.insertedId,
  });
}

export const POST = withApiSecurity(postRulesHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/rules", "/community/rules"],
});
