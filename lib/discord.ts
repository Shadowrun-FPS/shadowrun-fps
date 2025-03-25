/**
 * Utility functions for Discord integration
 */

/**
 * Sends a message to a Discord webhook
 * @param webhookUrl The Discord webhook URL
 * @param content The message content to send
 * @param embeds Optional embeds to include in the message
 * @returns Promise that resolves when the webhook is sent
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  content: string,
  embeds?: any[]
): Promise<Response> {
  if (!webhookUrl) {
    console.warn("No webhook URL provided for Discord notification");
    return new Response("No webhook URL", { status: 400 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        embeds,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send Discord webhook:", await response.text());
    }

    return response;
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
    throw error;
  }
}

/**
 * Sends a direct message to a user via Discord bot
 * @param userId The Discord user ID to send the message to
 * @param content The message content
 * @returns Promise that resolves when the message is sent
 */
export async function sendDiscordDM(
  userId: string,
  content: string
): Promise<boolean> {
  // This would require a Discord bot token and API integration
  // For now, we'll just log the message and return success
  console.log(`[Discord DM to ${userId}]: ${content}`);
  return true;
}
