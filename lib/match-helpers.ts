import { MapResult, Match, MatchPlayer, Queue } from "@/types/types";

import clientPromise from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import { getTimer, setTimer } from "@/app/matches/timers";

export async function getMatches() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const matches = await db.collection("Matches").find().toArray();
  return matches as unknown as Match[];
}

export async function getMatch(matchId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const matchData = await db
      .collection("Matches")
      .findOne({ matchId: matchId });
    return matchData as unknown as Match;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function addMatch(match: Match) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db.collection("Matches").insertOne(match);
  return result;
}

export async function submitMapResults(matchId: string, mapResults: MapResult) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db
    .collection("Matches")
    .updateOne({ matchId }, { $push: { results: mapResults } });
  return result;
}

export async function addPlayerToQueue(queueId: string, player: MatchPlayer) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const existingQueue = await db.collection("Queues").findOne({ queueId });
  if (existingQueue) {
    if (existingQueue.players.includes(player)) {
      throw new Error("Player already exists in the queue."); // Add error message
    }
    console.log("Adding player to queue", existingQueue, player);
    const players = existingQueue.players.concat(player);
    const result = await db
      .collection("Queues")
      .findOneAndUpdate(
        { queueId },
        { $set: { players: players } },
        { returnDocument: "after" }
      );
    return result;
  }
}

export async function removePlayerFromQueue(
  queueId: string,
  playerDiscordId: string
) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const existingQueue = await db.collection("Queues").findOne({ queueId });
  if (
    !existingQueue ||
    !existingQueue.players.some(
      (p: MatchPlayer) => p.discordId === playerDiscordId
    )
  ) {
    throw new Error("Player does not exist in the queue.");
  }
  const result = await db
    .collection("Queues")
    .updateOne(
      { queueId },
      { $pull: { players: { discordId: playerDiscordId } } }
    );
  return result;
}

export async function handleCreateMatch(
  queue: Queue,
  selectedPlayers: MatchPlayer[]
) {
  // Start match
  const match: Match = {
    matchId: uuidv4(),
    title: `Match ${queue.gameType} ${queue.teamSize}v${queue.teamSize}`,
    players: selectedPlayers,
    teamSize: queue.teamSize,
    gameType: queue.gameType,
    status: "ready-check",
    eloTier: queue.eloTier,
    createdTS: Date.now(),
    maps: [],
    results: [],
  };
  await addMatch(match);

  // Remove players from queue
  // TODO: comment back in after testing
  // await removePlayersFromQueue(queue.queueId, selectedPlayers);

  // Start match ready check
  const result = await startReadyCheck(match.matchId);
  console.log("Result of start ready check", result);
  return match;
}

export async function removePlayersFromQueue(
  queueId: string,
  players: MatchPlayer[]
) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db
    .collection("Queues")
    .updateOne({ queueId }, { $pull: { players: { $in: players } } });
  return result;
}

export async function markPlayerAsReady(
  matchId: string,
  discordId: string,
  isReady: boolean
) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db
    .collection("Matches")
    .updateOne(
      { matchId, "players.discordId": discordId },
      { $set: { "players.$.isReady": isReady } }
    );
  return result;
}

export async function updateMatchPlayers(
  matchId: string,
  players: MatchPlayer[]
) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db
    .collection("Matches")
    .updateOne({ matchId }, { $set: { players } });
  return result;
}

export async function updateMatchMaps(matchId: string, maps: any) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db
    .collection("Matches")
    .updateOne({ matchId }, { $set: { maps } });
  return result;
}

export async function updateMatchStatus(matchId: string, status: string) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db
    .collection("Matches")
    .updateOne({ matchId }, { $set: { status } });
  return result;
}

export async function startReadyCheck(matchId: string) {
  console.log("starting match ready check");
  const defaultTime = 300; // 6 minutes
  setTimer(matchId, defaultTime);
  decrementTimer(matchId);
  return { ok: true, message: "Match ready check started", status: 201 };
}

export async function getReadyCheckTime(matchId: string) {
  const timeRemaining = getTimer(matchId);
  return { ok: true, timeRemaining, status: 200 };
}

function decrementTimer(matchId: string) {
  // Decrement the timer for a match ready check
  const timer = setInterval(() => {
    let activeTimer = getTimer(matchId);
    let updatedTime = activeTimer - 1;
    setTimer(matchId, updatedTime);
    if (activeTimer <= 0) {
      clearInterval(timer);
    }
  }, 1000);
}

export async function pickMaps() {
  // Pick 3 random maps
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const maps = await db
    .collection("Maps")
    .aggregate([{ $sample: { size: 3 } }]);
  return maps.toArray();
}
