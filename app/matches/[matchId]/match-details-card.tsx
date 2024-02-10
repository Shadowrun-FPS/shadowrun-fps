import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Match } from "@/types/types";

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
        <CardDescription>
          <strong>Match ID:</strong> {match.matchId}
        </CardDescription>
      </CardHeader>
      <CardContent className="prose dark:prose-invert">
        <p>
          <strong>Type:</strong> {match.gameType}
        </p>
        <p>
          <strong>Status:</strong> {match.status}
        </p>
        <p>
          <strong>ELO Tier:</strong> {match.eloTier}
        </p>
        <p>
          <strong>Team Size:</strong> {match.teamSize}
        </p>
        <p>
          <strong>Created By:</strong> {match.createdBy}
        </p>
        <p>
          <strong>Created Timestamp:</strong> {match.createdTS}
        </p>
        <p>
          <strong>Anonymous:</strong> {match.anonymous}
        </p>
        {match.winner && (
          <p>
            <strong>{match.winner} Winner!</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
