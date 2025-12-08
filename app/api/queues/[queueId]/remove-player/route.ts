import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function postRemovePlayerHandler(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to remove a player" },
      { status: 401 }
    );
  }

  const isAdminOrMod =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session.user.roles &&
      (session.user.roles.includes("admin") ||
        session.user.roles.includes("moderator")));

  if (!isAdminOrMod) {
    return NextResponse.json(
      { error: "You don't have permission to remove players" },
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

  const body = await req.json();
  const validation = validateBody(body, {
    playerId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { playerId } = validation.data! as { playerId: string };
  const sanitizedPlayerId = sanitizeString(playerId, 50);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db
    .collection("Queues")
    .updateOne({ _id: new ObjectId(queueId) }, {
      $pull: {
        players: { discordId: sanitizedPlayerId },
      },
    } as any);

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to remove player" },
        { status: 400 }
      );
    }

    revalidatePath("/matches/queues");
    revalidatePath("/admin/queues");

    return NextResponse.json({
      success: true,
      message: "Player removed successfully",
    });
}

export const POST = withApiSecurity(postRemovePlayerHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
