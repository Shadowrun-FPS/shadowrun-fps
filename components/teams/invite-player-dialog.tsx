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
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SearchResult {
  id: string;
  name: string;
  username: string;
  elo: number;
  isInvited: boolean;
}

export function InvitePlayerDialog({ teamId }: { teamId: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/players/search?q=${encodeURIComponent(value)}&teamId=${teamId}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Search failed");

      console.log("Search results:", data);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for players",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (playerId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviterId: session.user.id,
          inviteeId: playerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invite");
      }

      // Refresh the invites list in the parent component
      const invitesResponse = await fetch(`/api/teams/${teamId}/invites`);
      if (invitesResponse.ok) {
        const newInvites = await invitesResponse.json();
        // Update the invites state in the parent component
        window.dispatchEvent(
          new CustomEvent("refreshInvites", { detail: newInvites })
        );
      }

      toast({
        title: "Success",
        description: "Player has been invited to the team",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invite",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Invite Player</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Player to Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by nickname or username..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : searchTerm.length < 2 ? (
              <p className="text-sm text-center text-muted-foreground">
                Type at least 2 characters to search
              </p>
            ) : results.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground">
                No players found
              </p>
            ) : (
              results.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
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
                      </p>
                    </div>
                  </div>
                  {player.isInvited ? (
                    <Button size="sm" variant="secondary" disabled>
                      Invited
                    </Button>
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
