import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postCreateNotificationHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateBody(body, {
    type: { type: "string", required: true, maxLength: 50 },
    title: { type: "string", required: true, maxLength: 200 },
    message: { type: "string", required: true, maxLength: 1000 },
    recipientId: { type: "string", required: true, maxLength: 50 },
    metadata: { type: "object", required: false },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { type, title, message, recipientId, metadata } = validation.data! as {
    type: string;
    title: string;
    message: string;
    recipientId: string;
    metadata?: any;
  };

  const sanitizedRecipientId = sanitizeString(recipientId, 50);

  const { db } = await connectToDatabase();

  let recipientUsername = "Unknown";
  let recipientNickname = "Unknown";

  const recipient = await db.collection("Players").findOne({
    discordId: sanitizedRecipientId,
  });

  if (recipient) {
    recipientUsername = sanitizeString(recipient.username || "Unknown", 100);
    recipientNickname = sanitizeString(recipient.nickname || recipientUsername, 100);
  }

  const result = await db.collection("Notifications").insertOne({
    userId: sanitizedRecipientId,
    type: sanitizeString(type, 50),
    title: sanitizeString(title, 200),
    message: sanitizeString(message, 1000),
    read: false,
    createdAt: new Date(),
    discordUsername: recipientUsername,
    discordNickname: recipientNickname,
    sender: {
      userId: session.user.id,
      username: sanitizeString(session.user.name || "Unknown", 100),
      nickname: sanitizeString(session.user.nickname || session.user.name || "Unknown", 100),
    },
    metadata: metadata || {},
  });

  revalidatePath("/notifications");

  return NextResponse.json({
    success: true,
    notificationId: result.insertedId,
  });
}

export const POST = withApiSecurity(postCreateNotificationHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/notifications"],
});
