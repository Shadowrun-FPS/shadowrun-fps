import ComingSoon from "../coming-soon";
import MatchList from "@/components/matches/match-list";
import { getRankedMatches } from "@/lib/match-helpers";

// async function updateMatch(match: Match) {
//   const url = createURL("/api/matches", { match: match });
//   return fetch(url, {
//     cache: "no-store",
//   })
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error("Failed to fetch match data.");
//       }
//       return response.json();
//     })
//     .catch((error) => {
//       throw new Error(error);
//     });
// }

export default async function GamesPage() {
  const matches = await getRankedMatches();

  return (
    <div className="grid gap-8">
      <h1 className="p-4 text-3xl font-extrabold">Play Ranked</h1>
      <MatchList matches={matches} />
    </div>
  );
}
