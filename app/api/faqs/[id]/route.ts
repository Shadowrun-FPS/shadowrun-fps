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

async function putFaqHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json(
      { error: "Only admins can update FAQs" },
      { status: 403 }
    );
  }

  const id = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid FAQ ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    title: { type: "string", required: false, maxLength: 200 },
    content: { type: "string", required: false, maxLength: 5000 },
    list: { type: "array", required: false },
    href: { type: "string", required: false, maxLength: 500 },
    link: { type: "string", required: false, maxLength: 500 },
    category: { type: "string", required: false, maxLength: 50 },
    order: { type: "number", required: false },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { title, content, list, href, link, category, order } = validation.data! as {
    title?: string;
    content?: string;
    list?: any[];
    href?: string;
    link?: string;
    category?: string;
    order?: number;
  };

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = sanitizeString(title, 200);
  if (content !== undefined) updateData.content = content ? sanitizeString(content, 5000) : "";
  if (list !== undefined) updateData.list = list || [];
  if (href !== undefined) updateData.href = href ? sanitizeString(href, 500) : "";
  if (link !== undefined) updateData.link = link ? sanitizeString(link, 500) : "";
  if (category !== undefined) updateData.category = category ? sanitizeString(category, 50) : "errors";
  if (order !== undefined) updateData.order = order;

  const result = await db.collection("FAQs").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "FAQ not found" },
      { status: 404 }
    );
  }

  revalidatePath("/faqs");
  revalidatePath("/admin/faqs");

  return NextResponse.json({ success: true });
}

export const PUT = withApiSecurity(putFaqHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/faqs", "/admin/faqs"],
});

async function deleteFaqHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json(
      { error: "Only admins can delete FAQs" },
      { status: 403 }
    );
  }

  const id = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid FAQ ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db.collection("FAQs").deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "FAQ not found" },
      { status: 404 }
    );
  }

  revalidatePath("/faqs");
  revalidatePath("/admin/faqs");

  return NextResponse.json({ success: true });
}

export const DELETE = withApiSecurity(deleteFaqHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/faqs", "/admin/faqs"],
});

