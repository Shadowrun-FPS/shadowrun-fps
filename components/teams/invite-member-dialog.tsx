"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";

interface Player {
  discordId: string;
  discordNickname: string;
  elo: number;
}

export function InviteMemberDialog({ teamId }: { teamId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const { toast } = useToast();

  const handleInvite = async (playerId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeId: playerId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send invite");

      toast({
        title: "Invite Sent",
        description: "Player has been invited to join the team",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Invite Player</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Player to Team</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search players..." />
          <CommandEmpty>No players found.</CommandEmpty>
          <CommandGroup>
            {players.map((player) => (
              <CommandItem
                key={player.discordId}
                onSelect={() => handleInvite(player.discordId)}
              >
                <span>{player.discordNickname}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  ELO: {player.elo}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
