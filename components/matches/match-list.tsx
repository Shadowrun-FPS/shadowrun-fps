import { Match } from "@/types/types";
import MatchCarousel from "./match-carousel";

type MatchListProps = {
  matches: Match[];
};

export default function MatchList({ matches }: MatchListProps) {
  // Split up matches by team size, only supports duos, trios and quads for now
  const duos = matches.filter((match) => match.teamSize === 2);
  const trios = matches.filter((match) => match.teamSize === 3);
  const quads = matches.filter((match) => match.teamSize === 4);

  return (
    <div>
      <div>
        <h3 className="text-3xl font-bold">Ranked Quads</h3>
        <MatchCarousel
          className="ml-8 mr-8 md:ml-16 md:mr-16"
          matches={quads}
          teamSize={4}
        />
      </div>

      <div>
        <h3 className="text-3xl font-bold">Ranked Trios</h3>
        <MatchCarousel
          className="ml-8 mr-8 md:ml-16 md:mr-16"
          matches={trios}
          teamSize={3}
        />
      </div>

      <div>
        <h3 className="text-3xl font-bold">Ranked Duos</h3>
        <MatchCarousel
          className="ml-8 mr-8 md:ml-16 md:mr-16"
          matches={duos}
          teamSize={2}
        />
      </div>
    </div>
  );
}
