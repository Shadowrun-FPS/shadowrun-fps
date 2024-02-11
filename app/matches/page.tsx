import MatchList from "@/components/matches/match-list";
import { getMatches } from "@/lib/match-helpers";
import CreateMatchDialog from "./create-match-dialog";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play Pick Up Matches",
};

export default async function MatchesPage() {
  const matches = await getMatches();

  const rankedMatches = matches.filter((match) => match.gameType === "ranked");

  return (
    <div>
      <div className="flex items-center gap-4">
        <h1 className="p-4 text-3xl font-extrabold">Play Matches!</h1>
        <CreateMatchDialog />
      </div>
      {/* TODO add filters for match parameters, can come from url params */}
      {/* TODO add rows for carousel of game types based on player */}

      <MatchList matches={rankedMatches} />
    </div>
  );
}
