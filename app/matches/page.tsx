import MatchList from "@/components/matches/match-list";
import { getMatches } from "@/lib/match-helpers";
import CreateMatchDialog from "./create-match-dialog";

import { Metadata } from "next";
import ComingSoon from "../coming-soon";
import { getFeatureFlag } from "@/lib/feature-flag-helpers";

export const metadata: Metadata = {
  title: "Play Pick Up Matches",
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: { MATCHMAKING_ENABLED: string };
}) {
  const matchMakingFeatureFlag = getFeatureFlag("MATCHMAKING_ENABLED", false, {
    MATCHMAKING_ENABLED: searchParams.MATCHMAKING_ENABLED,
  });
  if (!matchMakingFeatureFlag) {
    return (
      <ComingSoon
        title={"Ranked Matchmaking"}
        description={
          "Here is where you will be able to sign up for ranked pick up games, similar to the discord bot. To be released with the matchmaking feature."
        }
      />
    );
  }

  const matches = await getMatches();
  const rankedMatches = matches.filter((match) => match.gameType === "ranked");

  return (
    <div>
      {/* <div className="flex items-center gap-4">
        <h1 className="p-4 text-3xl font-extrabold">Play Matches!</h1>
        <CreateMatchDialog />
      </div> */}
      {/* TODO add filters for match parameters, can come from url params */}
      {/* TODO add rows for carousel of game types based on player */}

      <MatchList matches={rankedMatches} />
    </div>
  );
}
