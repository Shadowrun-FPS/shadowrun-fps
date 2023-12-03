import MatchCard from "@/components/matches/match-card";
import { Match } from "@/types/types";
import ComingSoon from "../../coming-soon";
import { createURL } from "@/lib/utils";

async function getRankedMatches() {
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

export default async function RankedPage() {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    const matches = await getRankedMatches()
      .then((data) => data.results)
      .catch((error) => {
        console.error(error);
        return undefined;
      });
    if (!matches) {
      return (
        <main className="container">
          <h1 className="p-4 text-3xl font-extrabold">
            Error loading ranked matches.
          </h1>
        </main>
      );
    }
    return (
      <div className="grid gap-8">
        <h1 className="p-4 text-3xl font-extrabold">Play Ranked</h1>
        <div className="flex flex-wrap gap-8">
          {matches?.map((match: Match) => {
            return (
              <MatchCard
                key={match.matchId}
                className="w-[350px]"
                match={match}
              />
            );
          })}
        </div>
      </div>
    );
  } else {
    return (
      <ComingSoon
        title={"Ranked pick up games"}
        description="Here is where you will be able to sign up for ranked pick up games, similar to the discord bot."
      />
    );
  }
}
