import ComingSoon from "../../coming-soon";
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

export default async function RankedPage() {
  const matches = await getRankedMatches();

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return (
      <div className="grid gap-8">
        <h1 className="p-4 text-3xl font-extrabold">Play Ranked</h1>
        <MatchList matches={matches} />
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
