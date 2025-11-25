"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, UserPlus, X, Users, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: string;
  name: string;
  username: string;
  elo: number;
  profilePicture?: string | null;
}

interface CoHostSelectorProps {
  selectedCoHosts: string[]; // Array of player IDs
  onCoHostsChange: (coHostIds: string[]) => void;
  maxCoHosts?: number;
  disabled?: boolean;
}

export function CoHostSelector({
  selectedCoHosts,
  onCoHostsChange,
  maxCoHosts = 3,
  disabled = false,
}: CoHostSelectorProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);

  // Fetch player details for selected co-hosts
  useEffect(() => {
    const fetchSelectedPlayers = async () => {
      if (selectedCoHosts.length === 0) {
        setSelectedPlayers([]);
        return;
      }

      try {
        const players: Player[] = [];
        for (const playerId of selectedCoHosts) {
          // Fetch player by ID using the API
          const response = await fetch(`/api/players/byId?id=${encodeURIComponent(playerId)}`);
          if (response.ok) {
            const player = await response.json();
            players.push({
              id: player.discordId,
              name: player.discordNickname || player.discordUsername,
              username: player.discordUsername,
              elo: player.stats?.[0]?.elo || player.elo || 0,
              profilePicture: player.discordProfilePicture || null,
            });
          }
        }
        setSelectedPlayers(players);
      } catch (error) {
        console.error("Error fetching selected players:", error);
      }
    };

    fetchSelectedPlayers();
  }, [selectedCoHosts]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/players/search?term=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) throw new Error("Failed to search players");

      const data = await response.json();
      // Filter out already selected players and current user
      const filtered = data.players.filter(
        (player: Player) =>
          !selectedCoHosts.includes(player.id) &&
          player.id !== session?.user?.id
      );
      setResults(filtered);
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

  const handleAddCoHost = (player: Player) => {
    if (selectedCoHosts.length >= maxCoHosts) {
      toast({
        title: "Maximum co-hosts reached",
        description: `You can only select up to ${maxCoHosts} co-hosts.`,
        variant: "destructive",
      });
      return;
    }

    if (selectedCoHosts.includes(player.id)) {
      return;
    }

    const newCoHosts = [...selectedCoHosts, player.id];
    onCoHostsChange(newCoHosts);
    setSelectedPlayers([...selectedPlayers, player]);
    setResults(results.filter((p) => p.id !== player.id));
    setSearchTerm("");
  };

  const handleRemoveCoHost = (playerId: string) => {
    // Check if user is trying to remove themselves
    if (playerId === session?.user?.id) {
      setPlayerToRemove(playerId);
      setShowRemoveConfirmation(true);
      return;
    }
    
    // Remove immediately if not self
    const newCoHosts = selectedCoHosts.filter((id) => id !== playerId);
    onCoHostsChange(newCoHosts);
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  const confirmRemoveSelf = () => {
    if (playerToRemove) {
      const newCoHosts = selectedCoHosts.filter((id) => id !== playerToRemove);
      onCoHostsChange(newCoHosts);
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerToRemove));
      setShowRemoveConfirmation(false);
      setPlayerToRemove(null);
      toast({
        title: "Co-Host Removed",
        description: "You have been removed as a co-host.",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Co-Hosts ({selectedCoHosts.length}/{maxCoHosts})
        </label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || selectedCoHosts.length >= maxCoHosts}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {selectedCoHosts.length >= maxCoHosts
                ? "Max Reached"
                : "Add Co-Host"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-6">
            <DialogHeader className="space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                  <Users className="relative w-5 h-5 text-primary drop-shadow-sm" />
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold">
                  Select Co-Hosts
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground pl-11">
                Search for players to add as co-hosts (up to {maxCoHosts})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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

              {/* Selected Co-Hosts */}
              {selectedPlayers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Co-Hosts:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayers.map((player) => (
                      <Badge
                        key={player.id}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        <Avatar className="w-4 h-4">
                          <AvatarFallback className="text-xs">
                            {player.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{player.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoHost(player.id)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="p-8 text-center rounded-lg border-2 border-dashed bg-muted/30">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {isLoading
                        ? "Searching for players..."
                        : "No players found"}
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
                          {player.profilePicture ? (
                            <Image
                              src={player.profilePicture}
                              alt={player.name}
                              width={44}
                              height={44}
                              className="w-full h-full object-cover rounded-full"
                              unoptimized
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                              {player.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {player.name}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            @{player.username} • ELO: {player.elo.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddCoHost(player)}
                          disabled={selectedCoHosts.length >= maxCoHosts}
                          className="h-9 sm:h-10"
                        >
                          <UserPlus className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Add</span>
                          <span className="sm:hidden">+</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog for Self-Removal */}
        <AlertDialog open={showRemoveConfirmation} onOpenChange={setShowRemoveConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <AlertDialogTitle>Remove Yourself as Co-Host?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Are you sure you want to remove yourself as a co-host? You will lose all tournament management permissions for this tournament.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowRemoveConfirmation(false);
                setPlayerToRemove(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveSelf}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove Me
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Display selected co-hosts outside dialog */}
      {selectedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPlayers.map((player) => (
            <Badge
              key={player.id}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1.5"
            >
              <Avatar className="w-4 h-4">
                {player.profilePicture ? (
                  <Image
                    src={player.profilePicture}
                    alt={player.name}
                    width={16}
                    height={16}
                    className="w-full h-full object-cover rounded-full"
                    unoptimized
                  />
                ) : (
                  <AvatarFallback className="text-xs">
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-xs">{player.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveCoHost(player.id)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                  title={player.id === session?.user?.id ? "Remove yourself as co-host" : "Remove co-host"}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

