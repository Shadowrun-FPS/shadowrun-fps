import { MapResult, Match, MatchPlayer, Player } from "@/types/types";

import clientPromise from "@/lib/mongodb";

export async function getMatches() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const matches = await db.collection("Matches").find().toArray();
  return matches as unknown as Match[];
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
  if (existingQueue && existingQueue.players.includes(player)) {
    throw new Error("Player already exists in the queue."); // Add error message
  }
  const result = await db
    .collection("Queues")
    .updateOne({ queueId }, { $push: { players: player } });
  return result;
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
