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
    <Card
      key={matchId}
      className={`flex flex-col min-h-[535px] m-4 ${className}`}
    >
      <div className="flex flex-col h-full">
        <CardHeader className="prose dark:prose-invert">
          <CardTitle className="my-2" title={title}>
            {title}
          </CardTitle>
          <CardDescription>{gameType}</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="max-w-md mx-auto prose dark:prose-invert">
            <h2>Team Size: {teamSize}</h2>
            <div className="grid grid-cols-2 gap-x-4">
              <h5 className="p-2">Team 1</h5>
              <h5 className="p-2">Team 2</h5>
              {players.map(async (player: Player) => (
                <PlayerItem
                  key={player.discordId}
                  discordId={player.discordId}
                  matchTeamSize={teamSize}
                />
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="grid grid-cols-2 gap-4 mt-auto">
          <MatchButton
            matchId={matchId}
            teamSize={match.teamSize}
            players={match.players}
            matchStatus={match.status}
          />
          <Button variant={"secondary"}>
            <Link href={`/matches/${matchId}`}>View Match</Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
