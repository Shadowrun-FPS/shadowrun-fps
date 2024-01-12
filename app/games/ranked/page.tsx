import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Ranked Playlist",
  openGraph: {
    title: "Ranked Playlist",
  },
};

import MatchCard from "@/components/matches/match-card";
import { MatchResult } from "@/types/types";
import ComingSoon from "../../coming-soon";

async function getRankedMatches() {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/api/matches?ranked=true",
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch match data.");
  }
  return await res.json();
}

export default async function RankedPage() {
  // const isDev = process.env.NODE_ENV === "development";
  const isDev = false;
  if (isDev) {
    const data = await getRankedMatches().catch((error) => {
      console.error(error);
      return undefined;
    });
    if (!data) {
      return (
        <main className="container">
          <h1 className="p-4 text-3xl font-extrabold">
            Error loading ranked matches.
          </h1>
        </main>
      );
    }
    const matches = data?.matches;
    return (
      <div>
        <h1 className="p-4 text-3xl font-extrabold">Play Ranked</h1>
        {matches?.map((match: MatchResult) => {
          return <MatchCard key={match.matchId} match={match} />;
        })}
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
