"use server";
import { submitMapResults } from "@/lib/match-helpers";

export async function handleSubmit(
  matchId: string,
  index: number,
  userName: string,
  values: any
) {
  const mapResults = {
    ...values,
    submittedBy: userName,
    map: index + 1,
  };
  const response = await submitMapResults(matchId, mapResults);
  return response;
}
