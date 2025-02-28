"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function CreateTeamDialog() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch available players when dialog opens
  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/players");
      const data = await response.json();
      setAvailablePlayers(
        data.filter(
          (p: Player) =>
            p.discordId !== session?.user?.id &&
            !selectedPlayers.some((sp) => sp.discordId === p.discordId)
        )
      );
    } catch (error) {
      console.error("Failed to fetch players:", error);
    }
  };

  const handleCreateTeam = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName,
          captain: session.user.id,
          members: [
            session.user.id,
            ...selectedPlayers.map((p) => p.discordId),
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to create team");

      toast({
        title: "Team Created",
        description: "Team invites have been sent to selected players.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            fetchPlayers();
            setIsOpen(true);
          }}
        >
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>
          <div className="grid gap-2">
            <Label>Invite Players</Label>
            <Command>
              <CommandInput placeholder="Search players..." />
              <CommandEmpty>No players found.</CommandEmpty>
              <CommandGroup>
                {availablePlayers.map((player) => (
                  <CommandItem
                    key={player.discordId}
                    onSelect={() => {
                      setSelectedPlayers([...selectedPlayers, player]);
                      setAvailablePlayers(
                        availablePlayers.filter(
                          (p) => p.discordId !== player.discordId
                        )
                      );
                    }}
                  >
                    <span>{player.discordNickname}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ELO: {player.elo}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </div>
          <div className="space-y-2">
            <Label>Selected Players</Label>
            <div className="space-y-1">
              {selectedPlayers.map((player) => (
                <div
                  key={player.discordId}
                  className="flex items-center justify-between p-2 rounded-md bg-muted"
                >
                  <span>{player.discordNickname}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPlayers(
                        selectedPlayers.filter(
                          (p) => p.discordId !== player.discordId
                        )
                      );
                      setAvailablePlayers([...availablePlayers, player]);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Button
          onClick={handleCreateTeam}
          disabled={!teamName || selectedPlayers.length === 0}
        >
          Create Team
        </Button>
      </DialogContent>
    </Dialog>
  );
}
