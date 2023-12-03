import { createURL } from "@/lib/utils";

export function getRankedMatches() {
  const url = createURL("/api/matches", { ranked: true });
  return fetch(url, {
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch match data.");
      }
      return response.json();
    })
    .catch((error) => {
      throw new Error(error);
    });
}
