import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postClearHandler(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to clear a queue" },
      { status: 401 }
    );
  }

  if (!isAdmin(session.user.id)) {
    return NextResponse.json(
      { error: "You don't have permission to clear queues" },
      { status: 403 }
    );
  }

  const queueId = sanitizeString(params.queueId, 50);
  if (!ObjectId.isValid(queueId)) {
    return NextResponse.json(
      { error: "Invalid queue ID format" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db
    .collection("Queues")
    .updateOne(
      { _id: new ObjectId(queueId) },
      { $set: { players: [] } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to clear queue" },
        { status: 400 }
      );
    }

    revalidatePath("/matches/queues");
    revalidatePath("/admin/queues");

    return NextResponse.json({
      success: true,
      message: "Queue cleared successfully",
    });
}

export const POST = withApiSecurity(postClearHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
