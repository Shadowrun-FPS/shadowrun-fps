import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Match } from "@/types/types";

import Link from "next/link";
import { Button } from "../ui/button";
import MatchButton from "./match-button";
interface MatchCardProps {
  match: Match;
  className?: string;
}

export default function MatchCard({ match, className }: MatchCardProps) {
  const { matchId, createdTS, teamSize, title, gameType, status, eloTier } =
    match;
  const createdDate = new Date(createdTS).toLocaleDateString();

  return (
    <Card key={matchId} className={`flex flex-col ${className}`}>
      <div className="flex flex-col h-full">
        <CardHeader className="prose dark:prose-invert">
          <CardTitle className="my-2" title={title}>
            {title}
          </CardTitle>
          <CardDescription>{createdDate}</CardDescription>
        </CardHeader>

        <CardContent>
          <p>Team Size: {teamSize}</p>
          <p>Game Type: {gameType}</p>
          <p>Elo Tier: {eloTier}</p>
          <p>Status: {status}</p>
        </CardContent>

        <CardFooter className="grid">
          <Button variant={"outline"}>
            <Link href={`/matches/${matchId}`}>View Match</Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
