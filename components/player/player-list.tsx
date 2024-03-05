import PlayerItem from "@/components/player/player-item";
import { MatchPlayer } from "@/types/types";

interface PlayerListProps {
  className?: string;
  players: MatchPlayer[];
  teamSize: number;
}

export default function PlayerList({
  className,
  players,
  teamSize,
}: PlayerListProps) {
  return (
    <div className="grid gap-4">
      <h2 className="text-3xl font-bold">Players</h2>
      <ul className={className}>
        {players.map((player: MatchPlayer, index: number) => (
          <li key={index} className="mb-1">
            <PlayerItem discordId={player.discordId} matchTeamSize={teamSize} />
          </li>
        ))}
      </ul>
    </div>
  );
}
