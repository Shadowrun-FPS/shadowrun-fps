import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { hasModeratorRole, SECURITY_CONFIG } from "@/lib/security-config";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number;
  discordProfilePicture?: string;
}

function matchParticipantToQueuePlayer(
  p: {
    discordId: string;
    discordUsername?: string;
    discordNickname?: string;
    discordProfilePicture?: string;
    elo?: number;
    initialElo?: number;
  },
  joinedAt: number
): QueuePlayer {
  const elo =
    typeof p.elo === "number"
      ? p.elo
      : typeof p.initialElo === "number"
        ? p.initialElo
        : 0;
  return {
    discordId: p.discordId,
    discordUsername: p.discordUsername || "",
    discordNickname: p.discordNickname || p.discordUsername || "",
    elo,
    joinedAt,
    discordProfilePicture: p.discordProfilePicture,
  };
}

async function postRevertToQueueHandler(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStaff =
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
    hasModeratorRole(session.user.roles ?? []);

  if (!isStaff) {
    return NextResponse.json(
      { error: "You don't have permission to revert matches" },
      { status: 403 }
    );
  }

  const { matchId: matchIdParam } = await params;
  const matchId = sanitizeString(matchIdParam, 120);

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const match = await db.collection("Matches").findOne({ matchId });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const queueIdRaw = match.queueId as string | undefined;
  if (!queueIdRaw || !ObjectId.isValid(queueIdRaw)) {
    return NextResponse.json(
      {
        error:
          "This match has no queue link (e.g. tournament or legacy match); revert is only for ranked queue matches.",
      },
      { status: 400 }
    );
  }

  const status = String(match.status || "").toLowerCase();
  if (status === "completed") {
    return NextResponse.json(
      { error: "Cannot revert a completed match" },
      { status: 400 }
    );
  }

  const team1 = (match.team1 || []) as Array<{
    discordId: string;
    discordUsername?: string;
    discordNickname?: string;
    discordProfilePicture?: string;
    elo?: number;
    initialElo?: number;
  }>;
  const team2 = (match.team2 || []) as typeof team1;

  if (!Array.isArray(team1) || !Array.isArray(team2)) {
    return NextResponse.json(
      { error: "Invalid match team data" },
      { status: 400 }
    );
  }

  const queue = await db
    .collection("Queues")
    .findOne({ _id: new ObjectId(queueIdRaw) });

  if (!queue) {
    return NextResponse.json({ error: "Original queue not found" }, { status: 404 });
  }

  const teamSize = typeof queue.teamSize === "number" ? queue.teamSize : 4;
  const required = teamSize * 2;

  const matchDiscordIds = new Set(
    [...team1, ...team2].map((p) => p.discordId).filter(Boolean)
  );

  /** Everyone still in the queue document who is not in this match (waitlist + joiners after launch). */
  const tailPlayers = ((queue.players || []) as QueuePlayer[]).filter(
    (p) => p && !matchDiscordIds.has(p.discordId)
  );

  /**
   * Queues UI sorts by joinedAt ascending to assign active vs waitlist slots. If we set
   * all returned players to Date.now(), they sort *after* people who joined earlier.
   * Place returned players strictly *before* every tail player's joinedAt so they occupy 1–N.
   */
  const minTailJoinedAt =
    tailPlayers.length > 0
      ? Math.min(
          ...tailPlayers.map((p) =>
            typeof p.joinedAt === "number" && !Number.isNaN(p.joinedAt)
              ? p.joinedAt
              : Date.now()
          )
        )
      : Date.now();

  // Same ordering as launch: sort by ELO descending for the block of returned players.
  const sortedMatchParticipants = [...team1, ...team2].sort(
    (a, b) =>
      (typeof b.elo === "number" ? b.elo : b.initialElo ?? 0) -
      (typeof a.elo === "number" ? a.elo : a.initialElo ?? 0)
  );

  const baseReturnedJoinedAt = minTailJoinedAt - required * 1000 - 1;

  const fromMatch: QueuePlayer[] = sortedMatchParticipants.map((p, i) =>
    matchParticipantToQueuePlayer(p, baseReturnedJoinedAt + i)
  );

  if (fromMatch.length !== required) {
    return NextResponse.json(
      {
        error: `Expected ${required} players on the match, found ${fromMatch.length}`,
      },
      { status: 400 }
    );
  }

  const merged: QueuePlayer[] = [];
  const seen = new Set<string>();
  for (const p of [...fromMatch, ...tailPlayers]) {
    if (!p?.discordId || seen.has(p.discordId)) continue;
    seen.add(p.discordId);
    merged.push(p);
  }

  await db.collection("Queues").updateOne(
    { _id: new ObjectId(queueIdRaw) },
    { $set: { players: merged } }
  );

  const del = await db.collection("Matches").deleteOne({ matchId });

  if (del.deletedCount === 0) {
    safeLog.error("revert-to-queue: queue updated but match delete failed", {
      matchId,
    });
    return NextResponse.json(
      { error: "Queue was restored but removing the match failed; contact support." },
      { status: 500 }
    );
  }

  if (global.io) {
    const updatedQueues = await db.collection("Queues").find({}).toArray();
    global.io.emit("queues:update", updatedQueues);
  }

  safeLog.info("Match reverted to queue", {
    matchId,
    queueId: queueIdRaw,
    moderatorId: session.user.id,
  });

  return NextResponse.json({
    success: true,
    message: "Match cancelled and players returned to the queue",
    queueId: queueIdRaw,
  });
}

export const POST = withApiSecurity(postRevertToQueueHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: false,
  revalidatePaths: [
    "/matches/queues",
    "/matches",
    "/admin/queues",
    "/admin/moderation",
  ],
});
