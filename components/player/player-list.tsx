import PlayerItem from "@/components/player/player-item";
import { Match, Player } from "@/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlayerList({ match }: { match: Match }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Players</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {match.players.map((player: Player, index: number) => (
            <li key={index} className="mb-1">
              <PlayerItem
                discordId={player.discordId}
                matchTeamSize={match.teamSize}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
