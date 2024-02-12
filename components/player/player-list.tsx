import PlayerItem from "@/components/player/player-item";
import { Match, Player } from "@/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerListProps {
  className?: string;
  players: Player[];
  teamSize: number;
  teamName: string;
}

export default function PlayerList({
  className,
  players,
  teamSize,
  teamName,
}: PlayerListProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{teamName}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {players.map((player: Player, index: number) => (
            <li key={index} className="mb-1">
              <PlayerItem
                discordId={player.discordId}
                matchTeamSize={teamSize}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
