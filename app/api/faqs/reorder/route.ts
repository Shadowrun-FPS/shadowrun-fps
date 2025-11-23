import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { withErrorHandling, createError } from "@/lib/error-handling";

// POST endpoint to batch update FAQ order
export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!isAuthorizedAdmin(session)) {
    throw createError.forbidden("Only admins can reorder FAQs");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const { faqs } = await req.json();

  if (!Array.isArray(faqs)) {
    throw createError.badRequest("FAQs must be an array");
  }

  // Validate all FAQs have _id and order
  for (const faq of faqs) {
    if (!faq._id || typeof faq.order !== "number") {
      throw createError.badRequest("Each FAQ must have _id and order");
    }
    if (!ObjectId.isValid(faq._id)) {
      throw createError.badRequest(`Invalid FAQ ID: ${faq._id}`);
    }
  }

  // Batch update all FAQs using bulkWrite
  const bulkOps = faqs.map((faq) => ({
    updateOne: {
      filter: { _id: new ObjectId(faq._id) },
      update: {
        $set: {
          order: faq.order,
          updatedAt: new Date(),
        },
      },
    },
  }));

  const result = await db.collection("FAQs").bulkWrite(bulkOps);

  return NextResponse.json({
    success: true,
    message: `Successfully updated order for ${result.modifiedCount} FAQs`,
    modifiedCount: result.modifiedCount,
  });
});

