"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function InvitePlayerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
  const handleSearch = async () => {
    if (searchTerm.trim().length < 3) {
      toast({
        title: "Error",
        description: "Please enter at least 3 characters to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/players/search?q=${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        throw new Error("Failed to search players");
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching players:", error);
      toast({
        title: "Error",
        description: "Failed to search players",
        variant: "destructive",
      });
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
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Button onClick={handleSearch} disabled={searching}>
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
                  key={player.discordId}
                  className="flex items-center justify-between p-3 border rounded-md border-border"
                >
                  <div>
                    <div className="font-medium">
                      {player.discordNickname || player.discordUsername}
                    </div>
                    {player.discordNickname && player.discordUsername && (
                      <div className="text-xs text-muted-foreground">
                        {player.discordUsername}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={inviting[player.discordId]}
                    onClick={() =>
                      handleInvite(
                        player.discordId,
                        player.discordNickname || player.discordUsername
                      )
                    }
                  >
                    {inviting[player.discordId] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Invite"
                    )}
                  </Button>
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
