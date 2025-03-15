import { connectToDatabase } from "@/lib/mongodb";

type NotificationType =
  | "team_invite"
  | "moderation"
  | "queue_match"
  | "team_member_joined"
  | "team_member_left";

interface NotificationMetadata {
  teamId?: string;
  teamName?: string;
  matchId?: string;
  moderationId?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}) {
  try {
    const { db } = await connectToDatabase();

    const notification = {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      metadata,
    };

    await db.collection("notifications").insertOne(notification);

    // You could add WebSocket or push notification logic here

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}
