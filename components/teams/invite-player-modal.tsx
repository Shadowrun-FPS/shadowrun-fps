"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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

export function InvitePlayerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [inviting, setInviting] = useState<Record<string, boolean>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Define closeModal before using it in any useEffect
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
    setSearchResults([]);
  }, []);

  // Listen for the custom event to open the modal
  useEffect(() => {
    const handleOpenModal = (e: any) => {
      setTeamId(e.detail.teamId);
      resetState(); // Reset state when opening
      setIsOpen(true);

      // Focus the search input after modal is visible
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    };

    window.addEventListener(
      "openInviteModal",
      handleOpenModal as EventListener
    );
    return () => {
      window.removeEventListener(
        "openInviteModal",
        handleOpenModal as EventListener
      );
    };
  }, []);

  // Reset all state when dialog closes/opens
  const resetState = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSearching(false);
    setInviting({});
  };

  // Now closeModal is defined before this useEffect uses it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeModal]);

  // Search for players
  const handleSearchPlayer = async (searchText: string) => {
    if (!searchText || searchText.length < 2) return;
    if (!teamId) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/players/search?term=${encodeURIComponent(
          searchText
        )}&includeTeamInfo=true&forTeamId=${encodeURIComponent(teamId)}`
      );

      if (!response.ok) {
        throw new Error("Failed to search players");
      }

      const data = await response.json();
      setSearchResults(data.players || []);
    } catch (error) {
      console.error("Error searching players:", error);
      toast({
        title: "Search Failed",
        description: "Could not search for players. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Send invite to player
  const handleInvite = async (playerId: string, playerName: string) => {
    if (!teamId) return;

    // Optimistically update UI immediately
    setSearchResults((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, isInvited: true } : p))
    );

    setInviting((prev) => ({ ...prev, [playerId]: true }));

    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          playerName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Revert optimistic update on error
        setSearchResults((prev) =>
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
          setSearchResults((prev) =>
            prev.map((p) =>
              p.id === playerId ? { ...p, isInvited: checkData.isInvited } : p
            )
          );
        }
      } catch (checkError) {
        // If check fails but invite was successful, keep optimistic update
      }

      toast({
        title: "Success",
        description: `Invite sent to ${playerName}`,
      });
    } catch (error: any) {
      console.error("Error inviting player:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    } finally {
      setInviting((prev) => ({ ...prev, [playerId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/70">
      <div
        ref={modalRef}
        className="m-4 w-full max-w-md rounded-lg border shadow-lg bg-card border-border"
      >
        <div className="flex justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Invite Players</h2>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 w-8 h-8"
            onClick={closeModal}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <Input
              ref={searchInputRef}
              placeholder="Search by name or Discord ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchPlayer(searchTerm);
              }}
            />
            <Button
              onClick={() => handleSearchPlayer(searchTerm)}
              disabled={searching}
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </div>

          <div className="overflow-auto space-y-2 max-h-64">
            {searchResults.length === 0 ? (
              <p className="py-4 text-sm text-center text-muted-foreground">
                {searching
                  ? "Searching..."
                  : "No players found. Try searching by username."}
              </p>
            ) : (
              searchResults.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-3 rounded-md border border-border"
                >
                  <div className="flex gap-3 items-center">
                    <DiscordPlayerAvatar
                      className="h-10 w-10"
                      discordId={player.id}
                      displayName={player.name}
                      storedAvatarUrl={player.discordProfilePicture}
                      resolvedAvatarUrl={player.profilePicture}
                    />
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.username}
                      </p>
                    </div>
                  </div>
                  {player.isMemberOfTargetTeam ? (
                    <Button variant="secondary" disabled size="sm" className="shrink-0">
                      Already on this team
                    </Button>
                  ) : player.isInvited ? (
                    <Button variant="secondary" disabled size="sm" className="shrink-0">
                      Invite pending
                    </Button>
                  ) : player.inTeamOfSameSize ? (
                    <Button
                      variant="outline"
                      disabled
                      size="sm"
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
                      disabled={inviting[player.id]}
                      onClick={() => handleInvite(player.id, player.name)}
                    >
                      {inviting[player.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
