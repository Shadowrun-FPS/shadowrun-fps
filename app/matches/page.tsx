import MatchList from "@/components/matches/match-list";
import { getRankedMatches } from "@/lib/match-helpers";
import CreateMatchDialog from "./creatematchdialog";

export default async function GamesPage() {
  const matches = await getRankedMatches();

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-4">
        <h1 className="p-4 text-3xl font-extrabold">Play Matches</h1>
        <CreateMatchDialog />
      </div>
      {/* TODO add filters for match parameters, can come from url params */}
      <MatchList matches={matches} />
    </div>
  );
}
