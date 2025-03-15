"use client";

import { PlayerContextMenu } from "@/components/player-context-menu";
import { cn } from "@/lib/utils";
import { Player } from "@/types/moderation";

interface PlayerNameDisplayProps {
  player: Player;
  className?: string;
}

export function PlayerNameDisplay({
  player,
  className,
}: PlayerNameDisplayProps) {
  return (
    <PlayerContextMenu player={player}>
      <span className={cn("font-medium", className)}>
        {player.discordNickname || player.discordUsername}
      </span>
    </PlayerContextMenu>
  );
}
