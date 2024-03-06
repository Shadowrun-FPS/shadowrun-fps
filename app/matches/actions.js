"use server";
import {
  addMatch,
  removePlayerFromQueue,
  addPlayerToQueue,
} from "@/lib/match-helpers";
import { uuid } from "uuidv4";
import { revalidateTag } from "next/cache";

export async function handleSubmit(values) {
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

export async function handleJoinQueue(queueId, player) {
  const response = await addPlayerToQueue(queueId, player);
  // TODO: remove players from other queues if one they are in starts
  revalidateTag("queues");
  console.log("Add Player to Queue Response", response);
  return response;
}

export async function handleLeaveQueue(queueId, playerDiscordId) {
  const response = await removePlayerFromQueue(queueId, playerDiscordId);
  revalidateTag("queues");

  return response;
}
