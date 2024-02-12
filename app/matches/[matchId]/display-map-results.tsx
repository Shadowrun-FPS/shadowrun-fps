import { MapResults } from "@/types/types";

export function DisplayMapResults({ result }: { result: MapResults }) {
  // TODO: Map results example: "Team 1 (6-4)" for team one winning with a score of 6
  return (
    <div className="prose dark:prose-invert">
      <h3>Map: {result.map}</h3>
      <p>Scored By: {result.scoredBy}</p>
      <div>
        Team 1: {result.scores.team1.team} {result.scores.team1.rounds} rounds.
      </div>
      <div>
        Team 2: {result.scores.team2.team} {result.scores.team2.rounds} rounds.
      </div>
    </div>
  );
}
