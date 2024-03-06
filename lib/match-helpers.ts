import { MapResult, Match, MatchPlayer, Queue } from "@/types/types";

import clientPromise from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";

export async function getMatches() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const matches = await db.collection("Matches").find().toArray();
  return matches as unknown as Match[];
}

export async function getMatchDetails(matchId: string) {
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
    // Check if queue is full, if so, start the match
    if (players.length + 1 >= existingQueue.teamSize * 2) {
      console.log("Queue is full, starting match");
      const selectedPlayers = players.slice(0, existingQueue.teamSize * 2);
      handleMatchStart(existingQueue as unknown as Queue, selectedPlayers);
    }
    const result = await db
      .collection("Queues")
      .updateOne({ queueId }, { $set: { players: players } });
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

export async function handleMatchStart(
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
  await removePlayersFromQueue(queue.queueId, selectedPlayers);
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
