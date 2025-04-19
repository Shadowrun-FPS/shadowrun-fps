import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import {
  APIEmbed,
  APIButtonComponent,
  ButtonStyle,
  ComponentType,
} from "discord-api-types/v10";

// Helper function to handle rate limits
async function makeDiscordRequest(requestFn: () => Promise<any>, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      // Check if this is a rate limit error
      if (error.status === 429 && error.data && error.data.retry_after) {
        const retryAfter = error.data.retry_after * 1000; // Convert to milliseconds
        console.log(
          `Rate limited by Discord API. Waiting ${retryAfter}ms before retry...`
        );

        // Wait for the retry_after period
        await new Promise((resolve) => setTimeout(resolve, retryAfter + 100)); // Add 100ms buffer

        // Try again after waiting
        continue;
      }

      // If it's not a rate limit or we've used all retries, rethrow
      throw error;
    }
  }
  throw new Error("Maximum retries reached for Discord API request");
}

// Enhanced Discord bot utility for sending rich message with embeds and buttons
export async function sendDirectMessage(
  userId: string,
  content: string,
  options?: {
    queueInfo?: {
      queueName: string;
      playerCount: number;
      timeLimit: number;
      timestamp: string;
      teamSize?: number;
    };
  }
) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.error("Discord bot token is not configured");
      return false;
    }

    const rest = new REST({ version: "10" }).setToken(token);

    // Create a DM channel with the user
    const dmChannel = (await makeDiscordRequest(() =>
      rest.post(Routes.userChannels(), {
        body: { recipient_id: userId },
      })
    )) as { id: string };

    // If queue info is provided, create a formatted embed
    if (options?.queueInfo) {
      // Create embed with the queue information
      const { queueName, playerCount, timeLimit, teamSize } = options.queueInfo;

      // Calculate expiration timestamp for Discord's timestamp formatting
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + timeLimit);
      const discordTimestamp = Math.floor(expirationTime.getTime() / 1000);

      // Create the embed with countdown timer
      const embed = {
        title: "Match Ready",
        description:
          "Your match is ready! Click the button below to view the queue.",
        color: 0x0099ff,
        fields: [
          { name: "Queue", value: queueName, inline: true },
          { name: "Players", value: `${playerCount} players`, inline: true },
          // Use Discord's timestamp format with R for relative time (countdown)
          { name: "Time", value: `<t:${discordTimestamp}:R>`, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Shadowrun FPS Matchmaking" },
      };

      // Determine the URL based on team size
      let queueUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "https://shadowrunfps.com"
      }/matches/queues#4v4`;

      // Add the appropriate hash based on team size
      if (teamSize === 1) {
        queueUrl += "#1v1";
      } else if (teamSize === 2) {
        queueUrl += "#2v2";
      } else if (teamSize === 4) {
        queueUrl += "#4v4";
      } else if (teamSize === 5) {
        queueUrl += "#5v5";
      }

      console.log("Sending Discord message with URL:", queueUrl);

      // Create button row with the View Queue button
      const components = [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              label: "View Queue",
              url: queueUrl,
            },
          ],
        },
      ];

      // Send message to the DM channel with rate limit handling
      await makeDiscordRequest(() =>
        rest.post(Routes.channelMessages(dmChannel.id), {
          body: {
            content,
            embeds: [embed],
            components,
          },
        })
      );

      return true;
    } else {
      // Regular DM without queue info, with rate limit handling
      await makeDiscordRequest(() =>
        rest.post(Routes.channelMessages(dmChannel.id), {
          body: { content },
        })
      );
      return true;
    }
  } catch (error) {
    console.error(`Failed to send DM to user ${userId}:`, error);
    return false;
  }
}
