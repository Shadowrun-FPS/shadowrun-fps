import { Match } from "@/types/types";
import MatchCarousel from "./match-carousel";

type MatchListProps = {
  matches: Match[];
};

export default function MatchList({ matches }: MatchListProps) {
  // Split up matches by team size, only supports duos, trios and quads for now
  const teamSize2 = matches.filter((match) => match.teamSize === 2);
  const teamSize3 = matches.filter((match) => match.teamSize === 3);
  const teamSize4 = matches.filter((match) => match.teamSize === 4);

  return (
    <div>
      {teamSize2.length > 0 && (
        <div>
          <h3 className="text-3xl font-bold">Ranked Duos</h3>
          <MatchCarousel
            className="ml-8 mr-8 md:ml-16 md:mr-16"
            matches={teamSize2}
          />
        </div>
      )}

      {teamSize3.length > 0 && (
        <div>
          <h3 className="text-3xl font-bold">Ranked Trios</h3>
          <MatchCarousel
            className="ml-8 mr-8 md:ml-16 md:mr-16"
            matches={teamSize3}
          />
        </div>
      )}

      {teamSize4.length > 0 && (
        <div>
          <h3 className="text-3xl font-bold">Ranked Quads</h3>
          <MatchCarousel
            className="ml-8 mr-8 md:ml-16 md:mr-16"
            matches={teamSize4}
          />
        </div>
      )}
    </div>
  );
}
