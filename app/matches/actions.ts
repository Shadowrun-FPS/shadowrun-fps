"use server";
import {
  addMatch,
  removePlayerFromQueue,
  addPlayerToQueue,
  markPlayerAsReady,
  getReadyCheckTime,
  handleMatchStart,
} from "@/lib/match-helpers";
import { uuid } from "uuidv4";
import { revalidateTag } from "next/cache";
import { MatchPlayer } from "@/types/types";

export async function handleSubmit(values: any) {
  const newMatch = {
    ...values,
    matchId: uuid(),
    teamSize: values["teamSize"][0],
    status: "queue",
    createdBy: "grimz", // TODO grab current users username
    createdTS: Date.now(),
    maps: [],
    players: [],
  };
  const response = await addMatch(newMatch);
  return response;
}

export async function handleJoinQueue(queueId: string, player: MatchPlayer) {
  const response = await addPlayerToQueue(queueId, player);
  // TODO: remove players from other queues if one they are in starts
  revalidateTag("queues");
  console.log("Add Player to Queue Response", response);
  return JSON.parse(JSON.stringify(response));
}

export async function handleLeaveQueue(
  queueId: string,
  playerDiscordId: string
) {
  const response = await removePlayerFromQueue(queueId, playerDiscordId);
  revalidateTag("queues");
  return response;
}

export async function triggerMatchStart(
  queue: any,
  selectedPlayers: MatchPlayer[]
) {
  console.log("Triggering match start", queue, selectedPlayers);
  const response = await handleMatchStart(queue, selectedPlayers);
  revalidateTag("queues");
  return response;
}

export async function handleReadyCheck(
  matchId: string,
  discordId: string,
  isReady: boolean
) {
  const response = await markPlayerAsReady(matchId, discordId, isReady);
  revalidateTag("readycheck_" + matchId);
  return response;
}

export async function getMatchReadyCheck(matchId: string) {
  const readyCheck = await getReadyCheckTime(matchId);
  return readyCheck;
}
