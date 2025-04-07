const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once("ready", () => {
  console.log(`Discord bot logged in as ${client.user.tag}`);
});

// Keep track of pending DMs
const pendingDMs = new Map();

// Listen for queue notifications via an internal API
const express = require("express");
const app = express();
app.use(express.json());

app.post("/api/bot/send-dm", async (req, res) => {
  const { userId, message } = req.body;

  try {
    // Get the user
    const user = await client.users.fetch(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send DM
    await user.send(message);

    // Track for confirmation
    pendingDMs.set(userId, Date.now());

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending DM:", error);
    return res.status(500).json({ error: "Failed to send DM" });
  }
});

const PORT = process.env.BOT_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bot API listening on port ${PORT}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
