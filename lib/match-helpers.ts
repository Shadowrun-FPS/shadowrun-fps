import { getApiUrl } from "@/lib/utils";
import { AddPlayerRequest } from "@/types/request-types";
import { MapResult, Match, Player } from "@/types/types";

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

export async function submitMapResults(matchId: string, mapResults: MapResult) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const result = await db
    .collection("Matches")
    .updateOne({ matchId }, { $push: { results: mapResults } });
  return result;
}
