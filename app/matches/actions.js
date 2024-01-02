"use server";
import { addMatch } from "@/lib/match-helpers";
import { uuid } from "uuidv4";

export async function handleSubmit(values) {
  const newMatch = {
    ...values,
    matchId: uuid(),
    teamSize: values["teamSize"][0],
    status: "queue",
    createdBy: "grimz", // TODO grab current users username
    maps: [],
    players: [],
  };
  const response = await addMatch(newMatch);
  return response;
}
