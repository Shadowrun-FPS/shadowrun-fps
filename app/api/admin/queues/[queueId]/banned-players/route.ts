import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

const DEVELOPER_DISCORD_ID = "238329746671271936";

async function patchBannedPlayersHandler(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queueId = sanitizeString(params.queueId, 50);
  if (!ObjectId.isValid(queueId)) {
    return NextResponse.json(
      { error: "Invalid queue ID" },
      { status: 400 }
    );
  }

  const isDeveloper =
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
    session.user.id === DEVELOPER_DISCORD_ID;
  const isAdmin = session.user.roles?.includes("admin") || session.user.isAdmin;
  const isFounder = session.user.roles?.includes("founder");

  if (!isDeveloper && !isAdmin && !isFounder) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const validation = validateBody(body, {
    bannedPlayers: { type: "array", required: true },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { bannedPlayers } = validation.data! as {
    bannedPlayers: string[];
  };

  // Validate all banned player IDs are strings
  if (!Array.isArray(bannedPlayers) || !bannedPlayers.every((id) => typeof id === "string")) {
    return NextResponse.json(
      { error: "bannedPlayers must be an array of strings" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const queue = await db.collection("Queues").findOne({
    _id: new ObjectId(queueId),
  });

  if (!queue) {
    return NextResponse.json({ error: "Queue not found" }, { status: 404 });
  }

  // Update the queue
  await db.collection("Queues").updateOne(
    { _id: new ObjectId(queueId) },
    {
      $set: {
        bannedPlayers: bannedPlayers,
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath("/admin/queues");
  revalidatePath(`/admin/queues/${queueId}`);

  return NextResponse.json({
    success: true,
    message: "Banned players updated successfully",
  });
}

export const PATCH = withApiSecurity(patchBannedPlayersHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  revalidatePaths: ["/admin/queues"],
});

