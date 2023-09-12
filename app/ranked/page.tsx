import MatchCard from "@/components/matches/match-card";
import { IMatch } from "@/types/types";

async function getRankedMatches() {
  const res = await fetch("http://localhost:3000/api/matches?ranked=true");
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}

export default async function RankedPage() {
  const matchesRes = await getRankedMatches();
  const matches = matchesRes.matches;
  console.log("matches: ", matches);
  return (
    <main className="container">
      <h1>Play Ranked</h1>
      {matches.map((match: IMatch) => {
        return <MatchCard key={match.matchId} match={match} />;
      })}
    </main>
  );
}
