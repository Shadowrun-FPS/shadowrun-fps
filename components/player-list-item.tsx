import Link from "next/link";

interface PlayerProps {
  player: {
    discordUsername: string;
    discordId: string;
  };
}

export function PlayerListItem({ player }: PlayerProps) {
  return (
    <Link
      href={`/player/stats?playerName=${encodeURIComponent(
        player.discordUsername
      )}`}
      className="hover:underline"
    >
      {player.discordUsername}
    </Link>
  );
}
