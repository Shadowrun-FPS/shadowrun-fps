import { Match } from "@/types/types";
import MatchCard from "./match-card";
import MatchCarousel from "./match-carousel";

type MatchListProps = {
  matches: Match[];
};

export default function MatchList({ matches }: MatchListProps) {
  return (
    <div>
      <h2 className="text-4xl font-extrabold prose dark:prose-invert">
        Ranked 4v4
      </h2>

      <MatchCarousel
        className="ml-8 mr-8 md:ml-16 md:mr-16"
        matches={matches}
      />
    </div>
  );
}
