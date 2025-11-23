import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { withErrorHandling, createError } from "@/lib/error-handling";

// PUT update FAQ
export const PUT = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    throw createError.forbidden("Only admins can update FAQs");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const { id } = params;
  const { title, content, list, href, link, category, order } = await req.json();

  if (!ObjectId.isValid(id)) {
    throw createError.badRequest("Invalid FAQ ID");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content || "";
  if (list !== undefined) updateData.list = list || [];
  if (href !== undefined) updateData.href = href || "";
  if (link !== undefined) updateData.link = link || "";
  if (category !== undefined) updateData.category = category || "errors";
  if (order !== undefined) updateData.order = order;

  const result = await db.collection("FAQs").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    throw createError.notFound("FAQ not found");
  }

  return NextResponse.json({ success: true });
});

// DELETE FAQ
export const DELETE = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    throw createError.forbidden("Only admins can delete FAQs");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const { id } = params;

  if (!ObjectId.isValid(id)) {
    throw createError.badRequest("Invalid FAQ ID");
  }

  const result = await db.collection("FAQs").deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    throw createError.notFound("FAQ not found");
  }

  return NextResponse.json({ success: true });
});

