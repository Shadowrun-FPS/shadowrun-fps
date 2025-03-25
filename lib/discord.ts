interface WebhookPayload {
  matchId: string;
  type: "match_ready" | "match_start" | "match_complete";
  teams: {
    team1: any;
    team2: any;
  };
  result?: {
    team1Score?: number;
    team2Score?: number;
  };
}

export async function sendDiscordWebhook(payload: WebhookPayload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    let content = "";
    let embeds = [];

    switch (payload.type) {
      case "match_ready":
        content = "🎮 **Match Ready**";
        embeds = [
          {
            title: "Teams",
            fields: [
              {
                name: "Team 1",
                value: payload.teams.team1.players
                  .map((p: any) => p.discordNickname)
                  .join("\n"),
                inline: true,
              },
              {
                name: "Team 2",
                value: payload.teams.team2.players
                  .map((p: any) => p.discordNickname)
                  .join("\n"),
                inline: true,
              },
            ],
            color: 0x00ff00,
          },
        ];
        break;

      case "match_start":
        content = "🚀 **Match Started**";
        embeds = [
          {
            title: "Match Details",
            fields: [
              {
                name: "Team 1",
                value: `Average ELO: ${Math.round(
                  payload.teams.team1.averageElo
                )}`,
                inline: true,
              },
              {
                name: "Team 2",
                value: `Average ELO: ${Math.round(
                  payload.teams.team2.averageElo
                )}`,
                inline: true,
              },
            ],
            color: 0x0099ff,
          },
        ];
        break;

      case "match_complete":
        content = "🏆 **Match Complete**";
        embeds = [
          {
            title: "Match Results",
            fields: [
              {
                name: "Team 1",
                value: `Score: ${payload.result?.team1Score}`,
                inline: true,
              },
              {
                name: "Team 2",
                value: `Score: ${payload.result?.team2Score}`,
                inline: true,
              },
            ],
            color: 0xff9900,
          },
        ];
        break;
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        embeds,
        username: "Tournament Bot",
        avatar_url: "https://your-bot-avatar-url.com",
      }),
    });
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
  }
}
