import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isPlayerBanned } from "@/lib/ban-utils";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postQueueJoinHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const validation = validateBody(body, {
    queueId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { queueId } = validation.data! as { queueId: string };
  const sanitizedQueueId = sanitizeString(queueId, 50);
  const userId = sanitizeString(session.user.id, 50);

  const banStatus = await isPlayerBanned(userId);

  if (banStatus.isBanned) {
    return NextResponse.json(
      {
        error: "Unable to join queue",
        message: banStatus.message,
      },
      { status: 403 }
    );
  }

  revalidatePath("/matches/queues");
  revalidatePath("/admin/queues");

  return NextResponse.json({
    success: true,
    message: "Joined queue successfully",
  });
}

export const POST = withApiSecurity(postQueueJoinHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/matches/queues", "/admin/queues"],
});
