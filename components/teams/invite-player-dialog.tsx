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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Users, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SearchResult {
  id: string;
  name: string;
  username: string;
  elo: number;
  isInvited: boolean;
  inTeam: boolean;
  teamName?: string;
}

export function InvitePlayerDialog({ teamId }: { teamId: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/players/search?term=${encodeURIComponent(
          searchTerm
        )}&includeTeamInfo=true`
      );
      if (!response.ok) throw new Error("Failed to search players");

      const data = await response.json();

      // Check for invites for these players
      const inviteCheckPromises = data.players.map(async (player: any) => {
        const inviteResponse = await fetch(
          `/api/teams/${teamId}/invites/check/${player.id}`
        );
        const inviteData = await inviteResponse.json();
        return {
          ...player,
          isInvited: inviteData.isInvited,
          inTeam: player.team != null,
          teamName: player.team?.name,
        };
      });

      const playersWithInviteStatus = await Promise.all(inviteCheckPromises);
      setResults(playersWithInviteStatus);
    } catch (error) {
      console.error("Error searching players:", error);
      toast({
        title: "Error",
        description: "Failed to search for players.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (playerId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invite");
      }

      // Update the invited status in local state
      setResults((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, isInvited: true } : p))
      );

      toast({
        title: "Invite Sent",
        description: "Team invitation has been sent to the player.",
      });
    } catch (error: any) {
      console.error("Error inviting player:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Invite Player
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Players to Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Searching..."
                  : "No players found. Try searching for a player."}
              </p>
            ) : (
              results.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.username} • ELO: {player.elo}
                        {player.inTeam && (
                          <span className="ml-1 text-amber-500">
                            • In team: {player.teamName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {player.isInvited ? (
                    <Button size="sm" variant="secondary" disabled>
                      Invited
                    </Button>
                  ) : player.inTeam ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="cursor-not-allowed"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                            Invite
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>
                            This player is already in team &quot;
                            {player.teamName}&quot;
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button size="sm" onClick={() => handleInvite(player.id)}>
                      Invite
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
