"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, X, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SearchResult {
  id: string;
  name: string;
  username: string;
  elo: number;
  isInvited: boolean;
  inTeam: boolean;
  teamName?: string;
  profilePicture?: string;
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

    setSearching(true);
    try {
      const response = await fetch(
        `/api/players/search?term=${encodeURIComponent(
          searchText
        )}&includeTeamInfo=true`
      );

      if (!response.ok) {
        throw new Error("Failed to search players");
      }

      const data = await response.json();
      const players = data.players || [];

      // Add team status to each player
      const playersWithInviteStatus = players.map((player: any) => ({
        ...player,
        isInvited: false, // Will check this separately if needed
        inTeam: player.team != null,
        teamName: player.team?.name,
        profilePicture: player.profilePicture || player.discordProfilePicture,
      }));

      setSearchResults(playersWithInviteStatus);
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
        throw new Error(data.error || "Failed to send invite");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        ref={modalRef}
        className="w-full max-w-md m-4 border rounded-lg shadow-lg bg-card border-border"
      >
        <div className="flex justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Invite Players</h2>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
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

          <div className="space-y-2 overflow-auto max-h-64">
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
                  className="flex items-center justify-between p-3 border rounded-md border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {player.profilePicture ? (
                        <AvatarImage
                          src={player.profilePicture}
                          alt={player.name}
                        />
                      ) : null}
                      <AvatarFallback>
                        {player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.username}
                      </p>
                    </div>
                  </div>
                  {player.isInvited ? (
                    <Button variant="secondary" disabled>
                      Invited
                    </Button>
                  ) : player.inTeam ? (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="outline"
                              disabled
                              className="cursor-not-allowed"
                              size="sm"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                              Invite
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="p-2 text-sm bg-secondary text-secondary-foreground"
                        >
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
