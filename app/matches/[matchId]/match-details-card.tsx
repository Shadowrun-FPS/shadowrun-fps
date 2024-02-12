import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Match } from "@/types/types";
import { DisplayMapResults } from "./display-map-results";

interface MatchDetailsCardProps {
  match: Match;
  className?: string;
}

export default function MatchDetailsCard({
  match,
  className,
}: MatchDetailsCardProps) {
  return (
    <Card key={match.matchId} className={className}>
      <CardHeader>
        <CardTitle title={match.title}>{match.title}</CardTitle>
        <CardDescription>{match.matchId}</CardDescription>
      </CardHeader>
      <CardContent className="prose dark:prose-invert">
        <p>
          <strong>Status:</strong> {match.status}
        </p>
        <p>
          <strong>ELO Tier:</strong> {match.eloTier}
        </p>
        {match.winner && (
          <p>
            <strong>{match.winner} Winner!</strong>
          </p>
        )}
        <div className="grid gap-8 overflow-auto max-h-96">
          {match.results?.map((result) => (
            <DisplayMapResults key={result.map} result={result} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
