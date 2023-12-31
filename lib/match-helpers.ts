import { createGetURL, getApiUrl } from "@/lib/utils";
import { AddPlayerRequest } from "@/types/request-types";
import { Match, Player } from "@/types/types";

import clientPromise from "@/lib/mongodb";

export async function getRankedMatches() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const matches = await db.collection("Matches").find().toArray();
  return matches as unknown as Match[];
}

export function updateMatchPlayers(matchId: string, player: Player) {
  const url = getApiUrl();
  const body: AddPlayerRequest = {
    action: "addPlayer",
    matchId,
    player,
  };
  return fetch(url + "/api/matches", {
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to update match: " + matchId);
      }
      return response.json();
    })
    .catch((error) => {
      throw new Error(error);
    });
}
