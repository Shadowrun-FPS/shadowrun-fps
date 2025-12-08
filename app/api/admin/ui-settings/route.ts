import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function patchUISettingsHandler(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles?.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateBody(body, {
    component: { type: "string", required: true, maxLength: 100 },
    settings: { type: "object", required: true },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { component, settings } = validation.data! as {
    component: string;
    settings: Record<string, any>;
  };

  const sanitizedComponent = sanitizeString(component, 100);

  const client = await clientPromise;
  const db = client.db();

  await db
    .collection("ui_settings")
    .updateOne(
      { component: sanitizedComponent },
      { $set: { settings } },
      { upsert: true }
    );

  revalidatePath("/admin");
  return NextResponse.json({ success: true });
}

async function getUISettingsHandler(req: Request) {
  const { searchParams } = new URL(req.url);
  const componentParam = searchParams.get("component");

  if (!componentParam) {
    return NextResponse.json(
      { error: "Component parameter required" },
      { status: 400 }
    );
  }

  const component = sanitizeString(componentParam, 100);

  const client = await clientPromise;
  const db = client.db();

  const settings = await db.collection("ui_settings").findOne({ component });

  const response = NextResponse.json(settings?.settings || {});
  response.headers.set(
    "Cache-Control",
    "private, s-maxage=60, stale-while-revalidate=120"
  );
  return response;
}

export const PATCH = withApiSecurity(patchUISettingsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin"],
});

export const GET = withApiSecurity(getUISettingsHandler, {
  rateLimiter: "api",
  requireAuth: true,
  cacheable: true,
  cacheMaxAge: 60,
});
