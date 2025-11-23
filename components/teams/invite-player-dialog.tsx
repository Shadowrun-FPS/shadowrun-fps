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
import { Loader2, Users, AlertTriangle, Search, Check, UserPlus } from "lucide-react";
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
        duration: 2000,
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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
              <Users className="relative w-5 h-5 text-primary drop-shadow-sm" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
              Invite Players to Team
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Search for players to invite to your team
          </p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 h-11 border-2"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
              className="h-11 w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4 sm:hidden" />
                  Search
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center rounded-lg border-2 border-dashed bg-muted/30">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {isLoading ? "Searching for players..." : "No players found"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? "Please wait..."
                    : "Try searching by name or username"}
                </p>
              </div>
            ) : (
              results.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                        {player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{player.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        @{player.username} • ELO: {player.elo.toLocaleString()}
                        {player.inTeam && (
                          <span className="ml-1 text-amber-500 font-medium">
                            • In {player.teamName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {player.isInvited ? (
                      <Button size="sm" variant="secondary" disabled className="h-9 sm:h-10">
                        <Check className="h-4 w-4 mr-1.5" />
                        <span className="hidden sm:inline">Invited</span>
                      </Button>
                    ) : player.inTeam ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="cursor-not-allowed h-9 sm:h-10"
                            >
                              <AlertTriangle className="h-4 w-4 mr-1.5 text-amber-500" />
                              <span className="hidden sm:inline">In Team</span>
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
                      <Button 
                        size="sm" 
                        onClick={() => handleInvite(player.id)}
                        className="h-9 sm:h-10"
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        <span className="hidden sm:inline">Invite</span>
                        <span className="sm:hidden">+</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
