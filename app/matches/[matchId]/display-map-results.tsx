import { MapResult } from "@/types/types";

export function DisplayMapResults({ result }: { result?: MapResult }) {
  if (!result) return null;
  const winner =
    result.scores.team1.rounds > result.scores.team2.rounds
      ? "Team 1"
      : "Team 2";
  const scoredBy = result.scoredBy;
  const team1Rounds = result.scores.team1.rounds;
  const team2Rounds = result.scores.team2.rounds;
  return (
    <div className="prose dark:prose-invert">
      <p className="text-xs">
        {scoredBy}: {winner} wins {team1Rounds}/{team2Rounds}
      </p>
    </div>
  );
}
