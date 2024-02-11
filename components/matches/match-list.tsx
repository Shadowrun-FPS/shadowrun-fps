import { Match } from "@/types/types";
import MatchCard from "./match-card";
import MatchCarousel from "./match-carousel";
import { Button } from "../ui/button";

type MatchListProps = {
  matches: Match[];
};

export default function MatchList({ matches }: MatchListProps) {
  return (
    <div>
      <h1 className="text-2xl prose dark:prose-invert">Ranked 4v4</h1>
      <div className="flex gap-16">
        <Button variant="outline">Queue</Button>
        <MatchCarousel
          className="ml-16 mr-16"
          matches={matches}
          carouselItemClass="md:basis-1/2 lg:basis-1/3 w-[350px] md:w-[400px]"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {matches?.map((match: Match) => {
        return (
          <MatchCard
            key={match.matchId}
            className="w-[350px] md:w-[400px]"
            match={match}
          />
        );
      })}
    </div>
  );
}
