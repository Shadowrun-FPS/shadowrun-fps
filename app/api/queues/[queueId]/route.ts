import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function deleteQueueHandler(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized =
    session.user.roles?.includes("admin") ||
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID;

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Not authorized to delete queues" },
      { status: 403 }
    );
  }

  const queueId = sanitizeString(params.queueId, 50);
  if (!ObjectId.isValid(queueId)) {
    return NextResponse.json(
      { error: "Invalid queue ID" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

    // Try to find the queue first to verify it exists
    const queue = await db.collection("Queues").findOne({
      _id: new ObjectId(queueId),
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Delete the queue
    await db.collection("Queues").deleteOne({
      _id: new ObjectId(queueId),
    });

    revalidatePath("/matches/queues");
    revalidatePath("/admin/queues");

    return NextResponse.json({
      success: true,
      message: "Queue deleted successfully",
    });
}

export const DELETE = withApiSecurity(deleteQueueHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
