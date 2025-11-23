"use client";

import Link from "next/link";
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
  const displayName = player.discordNickname || player.discordUsername || "";
  // Use discordUsername for URL (lowercase, no spaces), but display nickname if available
  const profileUrl = `/player/stats?playerName=${encodeURIComponent(
    player.discordUsername || player.discordNickname || ""
  )}`;

  return (
    <PlayerContextMenu player={player}>
      <Link
        href={profileUrl}
        className={cn("font-medium hover:text-primary hover:underline transition-colors", className)}
        onClick={(e) => {
          // Allow context menu to work
          if (e.button === 2) return;
        }}
      >
        {displayName}
      </Link>
    </PlayerContextMenu>
  );
}
