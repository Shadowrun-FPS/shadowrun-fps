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
interface MatchCardProps {
  match: Match;
  className?: string;
}

export default function MatchCard({ match, className }: MatchCardProps) {
  const { players } = match;
  const isMatchFull = match.teamSize * 2 === players.length;

  return (
    <Card key={match.matchId} className={className}>
      <CardHeader>
        <CardTitle>{match.gameType}</CardTitle>
        <CardDescription>
          <div>MatchId: {match.matchId}</div>
          <div>Team Size: {match.teamSize}</div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-x-4">
            <h5 className="p-2">Team 1</h5>
            <h5 className="p-2">Team 2</h5>
            {players.map(async (player: Player) => (
              <PlayerItem
                discordId={player.discordId}
                matchTeamSize={match.teamSize}
              />
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-4">
        <JoinButton matchId={match.matchId} isMatchFull={isMatchFull} />
        <LeaveButton matchId={match.matchId} players={players} />
      </CardFooter>
    </Card>
  );
}
