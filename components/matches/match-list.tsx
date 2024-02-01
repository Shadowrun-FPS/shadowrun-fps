import { Match } from "@/types/types";
import MatchCard from "./match-card";

type MatchListProps = {
  matches: Match[];
};

export default function MatchList({ matches }: MatchListProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {matches?.map((match: Match) => {
        return (
          <MatchCard
            key={match.matchId}
            className="w-[300px] md:w-[400px]"
            match={match}
          />
        );
      })}
    </div>
  );
}
