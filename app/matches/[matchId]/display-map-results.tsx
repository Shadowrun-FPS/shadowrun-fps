import { MapResults } from "@/types/types";

export function DisplayMapResults({ result }: { result: MapResults }) {
  return (
    <div className="prose dark:prose-invert">
      <h3>Map: {result.map}</h3>
      <h3>Scored By: {result.scoredBy}</h3>
      <div>
        Team 1: {result.scores.team1.team} {result.scores.team1.rounds} rounds.
      </div>
      <div>
        Team 2: {result.scores.team2.team} {result.scores.team2.rounds} rounds.
      </div>
    </div>
  );
}
