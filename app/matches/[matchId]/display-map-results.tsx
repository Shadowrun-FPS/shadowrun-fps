import { MapResults } from "@/types/types";

export function DisplayMapResults({ result }: { result?: MapResults }) {
  if (!result) return null;
  const winner =
    result.scores.team1.rounds > result.scores.team2.rounds
      ? "Team 1"
      : "Team 2";
  return (
    <div className="prose dark:prose-invert">
      <p className="text-xs">
        {winner} wins {result.scores.team1.rounds} to{" "}
        {result.scores.team2.rounds} reported by {result.scoredBy}
      </p>
    </div>
  );
}
