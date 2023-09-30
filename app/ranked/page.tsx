import MatchCard from "@/components/matches/match-card";
import { Match } from "@/types/types";

async function getRankedMatches() {
  return await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/api/matches?ranked=true",
    { cache: "no-store" }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((result) => {
      return result.data;
    })
    .catch((error) => {
      console.error("There was a problem fetching match data: ", error.message);
      throw error;
    });
}

export default async function RankedPage() {
  const matches = await getRankedMatches();
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
    <main className="container">
      <h1 className="p-4 text-3xl font-extrabold">Play Ranked</h1>
      <div className="grid grid-cols-2 gap-8">
        {matches?.map((match: Match) => {
          return <MatchCard key={match.matchId} match={match} />;
        })}
      </div>
    </main>
  );
}
