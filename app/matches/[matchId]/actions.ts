"use server";
import { submitMapResults } from "@/lib/match-helpers";
import { TeamNumber } from "@/types/types";
import { revalidatePath } from "next/cache";

export async function handleSubmit(
  matchId: string,
  index: number,
  userNickname: string,
  values: any,
  team?: TeamNumber
) {
  const mapResults = {
    scores: { ...values },
    scoredBy: userNickname,
    team: team,
    map: (index + 1) as 1 | 2 | 3, // Update the type of 'map' property
  };
  const response = await submitMapResults(matchId, mapResults);
  revalidatePath(`/matches/${matchId}`, "page");
  return response;
}
