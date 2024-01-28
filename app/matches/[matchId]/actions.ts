"use server";
import { submitMapResults } from "@/lib/match-helpers";

export async function handleSubmit(
  matchId: string,
  index: number,
  userName: string,
  values: any
) {
  const mapResults = {
    scores: { ...values },
    scoredBy: userName,
    map: (index + 1) as 1 | 2 | 3, // Update the type of 'map' property
  };
  console.log("mapResults:", mapResults);
  const response = await submitMapResults(matchId, mapResults);
  return response;
}
