import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { withErrorHandling, createError } from "@/lib/error-handling";

// GET all FAQs
export const GET = withErrorHandling(async (req: NextRequest) => {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const category = req.nextUrl.searchParams.get("category") || null;

  const query = category ? { category } : {};
  const faqs = await db
    .collection("FAQs")
    .find(query)
    .sort({ order: 1, createdAt: -1 })
    .toArray();

  return NextResponse.json(faqs);
});

// POST new FAQ
export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    throw createError.forbidden("Only admins can create FAQs");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const { title, content, list, href, link, category } = await req.json();

  if (!title) {
    throw createError.badRequest("Title is required");
  }

  // Get the highest order value
  const highestOrder = await db
    .collection("FAQs")
    .find({})
    .sort({ order: -1 })
    .limit(1)
    .toArray();

  const newOrder = highestOrder.length > 0 ? (highestOrder[0].order || 0) + 1 : 0;

  const faq = {
    title,
    content: content || "",
    list: list || [],
    href: href || "",
    link: link || "",
    category: category || "errors",
    order: newOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("FAQs").insertOne(faq);

  return NextResponse.json({
    success: true,
    faq: { ...faq, _id: result.insertedId },
  });
});

