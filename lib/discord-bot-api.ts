/**
 * Discord Bot API Client
 *
 * This utility provides functions to interact with the Discord bot's API server.
 * The bot API handles Discord-specific operations like sending DMs and posting embeds.
 */

const API_BASE_URL =
  process.env.DISCORD_BOT_API_URL || "http://localhost:3001/api";

/**
 * Get the Discord guild ID from environment variables
 */
export function getGuildId(): string {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) {
    throw new Error(
      "DISCORD_GUILD_ID is not configured. Please set it in your environment variables."
    );
  }
  return guildId;
}

/**
 * Call Discord bot API endpoint with retry logic
 */
async function callBotAPI(
  endpoint: string,
  method: string = "GET",
  body: any = null,
  retries: number = 3
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `API request failed: ${response.statusText}`,
        }));
        throw new Error(
          error.error || `API request failed: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      if (attempt === retries) {
        console.error(
          `Discord Bot API Error (${endpoint}) after ${retries} attempts:`,
          error
        );
        throw error;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Post queue embed to Discord
 */
export async function postQueueEmbed(queueId: string, guildId: string) {
  return callBotAPI(`/queues/${queueId}/post-embed`, "POST", { guildId });
}

/**
 * Post match embed to Discord
 */
export async function postMatchEmbed(
  matchId: string,
  guildId: string,
  threadId: string | null = null
) {
  const body: any = { guildId };
  if (threadId) body.threadId = threadId;
  return callBotAPI(`/matches/${matchId}/post-embed`, "POST", body);
}

/**
 * Post tournament embed to Discord
 */
export async function postTournamentEmbed(
  tournamentId: string,
  guildId: string
) {
  return callBotAPI(`/tournaments/${tournamentId}/post-embed`, "POST", {
    guildId,
  });
}

/**
 * Send queue ready notification to all queued players
 */
export async function notifyQueueReady(queueId: string, guildId: string) {
  return callBotAPI(`/queues/${queueId}/notify-ready`, "POST", { guildId });
}

/**
 * Send team member change notification
 */
export async function notifyTeamMemberChange(
  teamId: string,
  action: "joined" | "left" | "removed",
  member: {
    discordId: string;
    discordUsername?: string;
    discordNickname?: string;
  },
  teamSize: number,
  captainName?: string | null
) {
  const body: any = {
    action,
    member,
    teamSize,
  };
  if (captainName) body.captainName = captainName;
  return callBotAPI(`/teams/${teamId}/notify-member-change`, "POST", body);
}

/**
 * Send team invite notification
 * API-first approach: Call this immediately after creating the invite in the database.
 * Change streams will act as fallback if API fails (with duplicate prevention).
 *
 * @param inviteId - The MongoDB ObjectId of the TeamInvites document (as string)
 *                   This is REQUIRED and used by the bot to set button custom_ids for Accept/Reject
 */
export async function notifyTeamInvite(
  teamId: string,
  inviteeId: string,
  inviteeName: string,
  inviterId: string,
  inviterName: string,
  teamName: string,
  inviteId: string, // REQUIRED: MongoDB ObjectId of the TeamInvite document
  teamSize?: number, // Optional but recommended
  teamTag?: string,
  teamDescription?: string,
  currentMembers?: number,
  guildId?: string
) {
  const body: any = {
    inviteeId,
    inviteeName,
    inviterId,
    inviterName,
    teamName,
    inviteId, // REQUIRED: Include inviteId so bot can use it in button custom_ids
  };

  if (teamSize !== undefined) body.teamSize = teamSize;
  if (teamTag) body.teamTag = teamTag;
  if (teamDescription) body.teamDescription = teamDescription;
  if (currentMembers !== undefined) body.currentMembers = currentMembers;
  if (guildId) body.guildId = guildId;

  return callBotAPI(`/teams/${teamId}/notify-invite`, "POST", body);
}

/**
 * Send team join request notification
 */
export async function notifyTeamJoinRequest(
  teamId: string,
  requesterId: string,
  requesterName: string,
  teamName: string,
  captainId: string
) {
  return callBotAPI(`/teams/${teamId}/notify-join-request`, "POST", {
    requesterId,
    requesterName,
    teamName,
    captainId,
  });
}

/**
 * Send scrimmage challenge notification to challenged team captain
 */
export async function notifyScrimmageChallenge(
  scrimmageId: string,
  challengerTeamId: string,
  challengerTeamName: string,
  challengedTeamId: string,
  challengedTeamCaptainId: string,
  proposedDate: Date,
  maps: Array<{ mapName: string; gameMode: string }>,
  message?: string,
  guildId?: string
) {
  const body: any = {
    scrimmageId,
    challengerTeamId,
    challengerTeamName,
    challengedTeamId,
    challengedTeamCaptainId,
    proposedDate: proposedDate.toISOString(),
    maps,
  };
  if (message) body.message = message;
  if (guildId) body.guildId = guildId;
  return callBotAPI(
    `/scrimmages/${scrimmageId}/notify-challenge`,
    "POST",
    body
  );
}

/**
 * Send scrimmage response notification to challenger team members
 * Handles batching to respect Discord rate limits
 */
export async function notifyScrimmageResponse(
  scrimmageId: string,
  challengerTeamId: string,
  challengedTeamName: string,
  response: "accept" | "reject" | "counter",
  memberIds: string[],
  counterProposedDate?: Date,
  message?: string,
  guildId?: string
) {
  // Batch members to avoid rate limits (Discord allows 5 DMs per 5 seconds per bot)
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1100; // 1.1 seconds to be safe

  const body: any = {
    scrimmageId,
    challengerTeamId,
    challengedTeamName,
    response,
    memberIds,
  };
  if (counterProposedDate)
    body.counterProposedDate = counterProposedDate.toISOString();
  if (message) body.message = message;
  if (guildId) body.guildId = guildId;

  // If we have many members, send in batches
  if (memberIds.length > BATCH_SIZE) {
    const batches: string[][] = [];
    for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
      batches.push(memberIds.slice(i, i + BATCH_SIZE));
    }

    // Send first batch immediately
    const firstBatchBody = { ...body, memberIds: batches[0] };
    await callBotAPI(
      `/scrimmages/${scrimmageId}/notify-response`,
      "POST",
      firstBatchBody
    );

    // Send remaining batches with delays
    for (let i = 1; i < batches.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES)
      );
      const batchBody = { ...body, memberIds: batches[i] };
      await callBotAPI(
        `/scrimmages/${scrimmageId}/notify-response`,
        "POST",
        batchBody
      );
    }
  } else {
    // Small number of members, send all at once
    return callBotAPI(
      `/scrimmages/${scrimmageId}/notify-response`,
      "POST",
      body
    );
  }
}

/**
 * Send scrimmage cancellation notification
 */
export async function notifyScrimmageCancellation(
  scrimmageId: string,
  cancelledTeamId: string,
  cancelledTeamName: string,
  otherTeamCaptainId: string,
  reason: string,
  guildId?: string
) {
  const body: any = {
    scrimmageId,
    cancelledTeamId,
    cancelledTeamName,
    otherTeamCaptainId,
    reason,
  };
  if (guildId) body.guildId = guildId;
  return callBotAPI(
    `/scrimmages/${scrimmageId}/notify-cancellation`,
    "POST",
    body
  );
}

/**
 * Send tournament launch notification to all team captains
 * Handles batching to respect Discord rate limits
 */
export async function notifyTournamentLaunch(
  tournamentId: string,
  tournamentName: string,
  captainIds: string[],
  guildId?: string
) {
  // Batch captains to avoid rate limits (Discord allows 5 DMs per 5 seconds per bot)
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1100; // 1.1 seconds to be safe

  const body: any = {
    tournamentId,
    tournamentName,
    captainIds,
  };
  if (guildId) body.guildId = guildId;

  // If we have many captains, send in batches
  if (captainIds.length > BATCH_SIZE) {
    const batches: string[][] = [];
    for (let i = 0; i < captainIds.length; i += BATCH_SIZE) {
      batches.push(captainIds.slice(i, i + BATCH_SIZE));
    }

    // Send first batch immediately
    const firstBatchBody = { ...body, captainIds: batches[0] };
    await callBotAPI(
      `/tournaments/${tournamentId}/notify-launch`,
      "POST",
      firstBatchBody
    );

    // Send remaining batches with delays
    for (let i = 1; i < batches.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES)
      );
      const batchBody = { ...body, captainIds: batches[i] };
      await callBotAPI(
        `/tournaments/${tournamentId}/notify-launch`,
        "POST",
        batchBody
      );
    }
  } else {
    // Small number of captains, send all at once
    return callBotAPI(
      `/tournaments/${tournamentId}/notify-launch`,
      "POST",
      body
    );
  }
}

/**
 * Health check
 */
export async function checkBotHealth() {
  return callBotAPI("/health", "GET");
}
