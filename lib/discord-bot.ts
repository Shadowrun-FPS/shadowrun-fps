import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import {
  APIEmbed,
  APIButtonComponent,
  ButtonStyle,
  ComponentType,
} from "discord-api-types/v10";

// Enhanced Discord bot utility for sending rich message with embeds and buttons
export async function sendDirectMessage(
  userId: string,
  message: string,
  options?: {
    embed?: APIEmbed;
    buttons?: APIButtonComponent[];
    queueInfo?: {
      queueName: string;
      playerCount: number;
      timeLimit: number;
      timestamp?: string;
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
    const dmChannel = (await rest.post(Routes.userChannels(), {
      body: { recipient_id: userId },
    })) as { id: string };

    // Prepare message components and embeds
    const messagePayload: any = { content: message };

    // If queue info is provided, create a formatted embed
    if (options?.queueInfo) {
      const { queueName, playerCount, timeLimit, timestamp } =
        options.queueInfo;
      const currentTime = new Date().toLocaleString();

      messagePayload.embeds = [
        {
          title: "Match Ready",
          description: "Your match is ready! Click the button below to join.",
          color: 0x5865f2, // Discord blue color
          fields: [
            {
              name: "Queue",
              value: queueName,
              inline: true,
            },
            {
              name: "Players",
              value: `${playerCount} players`,
              inline: true,
            },
            {
              name: "Time",
              value: `${timeLimit} minutes to join`,
              inline: true,
            },
          ],
          footer: {
            text: `Shadowrun FPS Matchmaking • ${timestamp || currentTime}`,
          },
        },
      ];

      // Add buttons
      messagePayload.components = [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Success,
              label: "Join Match",
              custom_id: "join_match",
              emoji: { name: "✅" },
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Danger,
              label: "Decline",
              custom_id: "decline_match",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              label: "View Queue",
              url: `${
                process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.com"
              }/matches/queues`,
            },
          ],
        },
      ];
    } else if (options?.embed || options?.buttons) {
      // Support for custom embeds and buttons
      if (options.embed) {
        messagePayload.embeds = [options.embed];
      }

      if (options.buttons && options.buttons.length > 0) {
        messagePayload.components = [
          {
            type: ComponentType.ActionRow,
            components: options.buttons,
          },
        ];
      }
    }

    // Send message to the DM channel
    await rest.post(Routes.channelMessages(dmChannel.id), {
      body: messagePayload,
    });

    console.log(`Successfully sent DM to user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error sending Discord DM:", error);
    return false;
  }
}
