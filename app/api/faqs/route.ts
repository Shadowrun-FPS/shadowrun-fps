import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function getFaqsHandler(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const categoryParam = req.nextUrl.searchParams.get("category");
  const category = categoryParam ? sanitizeString(categoryParam, 50) : null;

  const query = category ? { category } : {};
  const faqs = await db
    .collection("FAQs")
    .find(query)
    .sort({ order: 1, createdAt: -1 })
    .toArray();

  const response = NextResponse.json(faqs);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  return response;
}

export const GET = withApiSecurity(getFaqsHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 3600,
});

async function postFaqsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json(
      { error: "Only admins can create FAQs" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    title: { type: "string", required: true, maxLength: 200 },
    content: { type: "string", required: false, maxLength: 5000 },
    list: { type: "array", required: false },
    href: { type: "string", required: false, maxLength: 500 },
    link: { type: "string", required: false, maxLength: 500 },
    category: { type: "string", required: false, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { title, content, list, href, link, category } = validation.data! as {
    title: string;
    content?: string;
    list?: any[];
    href?: string;
    link?: string;
    category?: string;
  };

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  // Get the highest order value
  const highestOrder = await db
    .collection("FAQs")
    .find({})
    .sort({ order: -1 })
    .limit(1)
    .toArray();

  const newOrder = highestOrder.length > 0 ? (highestOrder[0].order || 0) + 1 : 0;

  const faq = {
    title: sanitizeString(title, 200),
    content: content ? sanitizeString(content, 5000) : "",
    list: list || [],
    href: href ? sanitizeString(href, 500) : "",
    link: link ? sanitizeString(link, 500) : "",
    category: category ? sanitizeString(category, 50) : "errors",
    order: newOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("FAQs").insertOne(faq);

  revalidatePath("/faqs");
  revalidatePath("/admin/faqs");

  return NextResponse.json({
    success: true,
    faq: { ...faq, _id: result.insertedId },
  });
}

export const POST = withApiSecurity(postFaqsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/faqs", "/admin/faqs"],
});

