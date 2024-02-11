import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Player, Match } from "@/types/types";

import PlayerItem from "../player/player-item";

import Link from "next/link";
import { Button } from "../ui/button";
import MatchButton from "./match-button";
interface MatchCardProps {
  match: Match;
  className?: string;
}

export default function MatchCard({ match, className }: MatchCardProps) {
  const { matchId, players, teamSize, title, gameType } = match;

  return (
    <Card key={matchId} className={`flex flex-col ${className}`}>
      <div className="flex flex-col h-full">
        <CardHeader className="prose dark:prose-invert">
          <CardTitle className="my-2" title={title}>
            {title}
          </CardTitle>
          <CardDescription>{gameType}</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow">
          <h2>Team Size: {teamSize}</h2>
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
