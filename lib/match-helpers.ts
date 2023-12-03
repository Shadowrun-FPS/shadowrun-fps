import { createGetURL, getApiUrl } from "@/lib/utils";
import { AddPlayerRequest } from "@/types/request-types";
import { Player } from "@/types/types";

export function getRankedMatches() {
  const url = createGetURL("/api/matches", { ranked: true });
  return fetch(url, {
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch match data.");
      }
      return response.json();
    })
    .then((data) => data.results)
    .catch((error) => {
      throw new Error(error);
    });
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
