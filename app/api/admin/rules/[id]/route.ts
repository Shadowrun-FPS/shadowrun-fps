import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function putRuleHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid rule ID" },
      { status: 400 }
    );
  }

  const data = await req.json();
  const validation = validateBody(data, {
    title: { type: "string", required: false, maxLength: 200 },
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
    title?: string;
    description?: string;
    severity?: string;
  };

  const { db } = await connectToDatabase();

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = sanitizeString(title, 200);
  if (description !== undefined) updateData.description = description ? sanitizeString(description, 5000) : "";
  if (severity !== undefined) updateData.severity = sanitizeString(severity, 50);

  const result = await db.collection("Rules").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  revalidatePath("/admin/rules");
  revalidatePath("/community/rules");

  return NextResponse.json({ success: true });
}

export const PUT = withApiSecurity(putRuleHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/rules", "/community/rules"],
});

async function deleteRuleHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorizedAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(params.id, 50);
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid rule ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const result = await db
    .collection("Rules")
    .deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  revalidatePath("/admin/rules");
  revalidatePath("/community/rules");

  return NextResponse.json({ success: true });
}

export const DELETE = withApiSecurity(deleteRuleHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/admin/rules", "/community/rules"],
});
