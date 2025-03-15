import { connectToDatabase } from "@/lib/mongodb";

async function addDiscordInfoToNotifications() {
  const { db } = await connectToDatabase();

  // Get all notifications without discord info
  const notifications = await db
    .collection("Notifications")
    .find({
      $or: [
        { discordUsername: { $exists: false } },
        { discordNickname: { $exists: false } },
      ],
    })
    .toArray();

  console.log(`Found ${notifications.length} notifications to update`);

  for (const notification of notifications) {
    // Look up user info from Players collection
    const player = await db
      .collection("Players")
      .findOne({ discordId: notification.userId });

    if (player) {
      // Update the notification with user info
      await db.collection("Notifications").updateOne(
        { _id: notification._id },
        {
          $set: {
            discordUsername: player.username || "Unknown",
            discordNickname: player.nickname || player.username || "Unknown",
          },
        }
      );
      console.log(`Updated notification ${notification._id}`);
    } else {
      // Set defaults if user not found
      await db.collection("Notifications").updateOne(
        { _id: notification._id },
        {
          $set: {
            discordUsername: "Unknown",
            discordNickname: "Unknown",
          },
        }
      );
      console.log(`Set defaults for notification ${notification._id}`);
    }
  }

  console.log("Migration complete");
}

// Run the migration
addDiscordInfoToNotifications()
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err));
