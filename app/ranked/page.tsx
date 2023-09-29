import MatchCard from "@/components/matches/match-card";
import { MatchResult } from "@/types/types";

async function getRankedMatches() {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/api/matches?ranked=true"
  );
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}

export default async function RankedPage() {
  const matchesRes = await getRankedMatches();
  const matches = matchesRes;
  return (
    <main className="container">
      <h1 className="p-4 text-3xl font-extrabold">Play Ranked</h1>
      {matches.map((match: MatchResult) => {
        return <MatchCard key={match.matchId} match={match} />;
      })}
    </main>
  );
}
