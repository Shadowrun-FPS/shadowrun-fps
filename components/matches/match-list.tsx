import { Match } from "@/types/types";
import MatchCard from "./match-card";

type MatchListProps = {
  matches: Match[];
};

export default function MatchList({ matches }: MatchListProps) {
  return (
    <div className="flex flex-wrap gap-8">
      {matches?.map((match: Match) => {
        return <MatchCard key={match.matchId} className="w-72" match={match} />;
      })}
    </div>
  );
}
