import { MapResults } from "@/types/types";

export function DisplayMapResults({ result }: { result: MapResults }) {
  const winner =
    result.scores.team1.rounds > result.scores.team2.rounds
      ? "Team 1"
      : "Team 2";
  return (
    <div className="prose dark:prose-invert">
      <p>
        {winner} wins {result.scores.team1.rounds} to
        {result.scores.team2.rounds}
      </p>
    </div>
  );
}
