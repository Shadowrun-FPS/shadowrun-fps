import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Player, Match } from "@/types/types";
import JoinButton from "./join-button";
import LeaveButton from "./leave-button";
import PlayerItem from "../player/player-item";

import Link from "next/link";
import { Button } from "../ui/button";
interface MatchCardProps {
  match: Match;
  className?: string;
}

export default function MatchCard({ match, className }: MatchCardProps) {
  const { matchId, players, teamSize, title, gameType } = match;
  const isMatchFull = teamSize * 2 === players.length;

  return (
    <Card key={matchId} className={className}>
      <CardHeader className="prose dark:prose-invert">
        <CardTitle className="my-2" title={title}>
          {title}
        </CardTitle>
        <CardDescription>{gameType}</CardDescription>
      </CardHeader>
      <CardContent>
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

      <CardFooter className="grid grid-cols-2 gap-4">
        <Button className="col-span-2">
          <Link href={`/matches/${matchId}`}>View Match</Link>
        </Button>
        <JoinButton matchId={matchId} isMatchFull={isMatchFull} />
        <LeaveButton matchId={matchId} players={players} />
      </CardFooter>
    </Card>
  );
}
