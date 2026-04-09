"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { DiscordPlayerAvatar } from "@/components/teams/discord-player-avatar";

interface SearchResult {
  id: string;
  name: string;
  username: string;
  elo: number;
  isInvited: boolean;
  inTeam: boolean;
  inTeamOfSameSize: boolean;
  isMemberOfTargetTeam?: boolean;
  teamName?: string;
  teamSize?: number;
  profilePicture?: string;
  discordProfilePicture?: string | null;
}

export function InvitePlayerDialog({ teamId }: { teamId: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invitingPlayerId, setInvitingPlayerId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/players/search?term=${encodeURIComponent(
          searchTerm
        )}&includeTeamInfo=true&forTeamId=${encodeURIComponent(teamId)}`
      );
      if (!response.ok) throw new Error("Failed to search players");

      const data = await response.json();
      setResults(data.players || []);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error searching players:", error);
      }
      toast({
        title: "Error",
        description: "Failed to search for players.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (playerId: string, playerName: string) => {
    if (invitingPlayerId || isLoading) return; // Prevent duplicate submissions
    setInvitingPlayerId(playerId);
    try {
      // Optimistically update UI immediately
      setResults((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, isInvited: true } : p))
      );

      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, playerName }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Revert optimistic update on error
        setResults((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, isInvited: false } : p))
        );
        throw new Error(data.error || "Failed to send invite");
      }

      // Wait a bit for database write to complete, then verify
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Re-check the invite status from the server to ensure accuracy
      try {
        const checkResponse = await fetch(
          `/api/teams/${teamId}/invites/check/${playerId}`
        );
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          // Update the invited status in local state based on server response
          setResults((prev) =>
            prev.map((p) =>
              p.id === playerId ? { ...p, isInvited: checkData.isInvited } : p
            )
          );
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("Failed to verify invite status, keeping optimistic update");
          }
        }
      } catch (checkError) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Error verifying invite status, keeping optimistic update:", checkError);
        }
      }

      router.refresh();

      toast({
        title: "Success",
        description: `Invite sent to ${playerName}`,
        duration: 2000,
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error inviting player:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    } finally {
      setInvitingPlayerId(null);
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
            <DialogTitle className="text-xl sm:text-2xl font-bold">
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
                    <DiscordPlayerAvatar
                      className="h-10 w-10 shrink-0 border-2 border-primary/20 sm:h-11 sm:w-11"
                      discordId={player.id}
                      displayName={player.name}
                      storedAvatarUrl={player.discordProfilePicture}
                      resolvedAvatarUrl={player.profilePicture}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{player.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        @{player.username} • ELO: {player.elo.toLocaleString()}
                        {player.inTeamOfSameSize && (
                          <span className="ml-1 text-amber-500 font-medium">
                            • In {player.teamName} ({player.teamSize}-person)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {player.isMemberOfTargetTeam ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="h-auto max-w-[11rem] shrink-0 py-2"
                      >
                        <Check className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                        <span className="text-xs sm:text-sm">Already on this team</span>
                      </Button>
                    ) : player.isInvited ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="h-auto max-w-[11rem] shrink-0 py-2"
                      >
                        <Check className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                        <span className="text-xs sm:text-sm">Invite pending</span>
                      </Button>
                    ) : player.inTeamOfSameSize ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="h-auto max-w-[11rem] shrink-0 cursor-not-allowed flex-col gap-0.5 py-2"
                        title={
                          player.teamName
                            ? `Already in ${player.teamSize}v${player.teamSize} roster: ${player.teamName}`
                            : `Already in another ${player.teamSize}-player team`
                        }
                      >
                        <span className="flex items-center gap-1 text-xs font-medium leading-tight">
                          <AlertTriangle
                            className="h-3.5 w-3.5 shrink-0 text-amber-500"
                            aria-hidden
                          />
                          In another team
                        </span>
                        {player.teamName ? (
                          <span className="w-full truncate text-center text-[10px] leading-tight text-muted-foreground">
                            {player.teamName}
                          </span>
                        ) : null}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleInvite(player.id, player.name)}
                        className="h-9 sm:h-10"
                      >
                        <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
                        Invite
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
