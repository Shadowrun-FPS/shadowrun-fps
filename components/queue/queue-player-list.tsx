"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Player } from "@/types/types";
import { PlayerContextMenu } from "@/components/moderation/player-context-menu";

interface QueuePlayerListProps {
  players: Player[];
  teamSize: number;
}

export function QueuePlayerList({ players, teamSize }: QueuePlayerListProps) {
  const maxPlayers = teamSize * 2;
  const filledSlots = players.length;
  const emptySlots = Math.max(0, maxPlayers - filledSlots);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Players ({filledSlots}/{maxPlayers})
      </h3>
      <div className="space-y-1">
        {players.map((player) => (
          <PlayerContextMenu
            key={player.discordId}
            playerId={player.discordId}
            playerName={player.discordNickname || player.discordUsername}
          >
            <div className="flex items-center p-2 rounded-md hover:bg-accent">
              <Avatar className="w-6 h-6 mr-2">
                <AvatarImage
                  src={player.discordProfilePicture}
                  alt={player.discordNickname || player.discordUsername}
                />
                <AvatarFallback>
                  {(player.discordNickname || player.discordUsername || "?")
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {player.discordNickname || player.discordUsername}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {player.elo}
              </span>
            </div>
          </PlayerContextMenu>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center p-2 rounded-md bg-muted/30"
          >
            <div className="w-6 h-6 mr-2 rounded-full bg-muted" />
            <span className="text-sm text-muted-foreground">Waiting...</span>
          </div>
        ))}
      </div>
    </div>
  );
}
