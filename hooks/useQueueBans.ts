"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { safeLog } from "@/lib/security";
import type { AdminQueuePlayerSearchHit, AdminQueueRecord, RuntimeQueue } from "@/types/admin-queue";

interface UseQueueBansResult {
  bannedPlayers: string[];
  setBannedPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  bannedPlayersInfo: Record<string, { discordNickname?: string; discordUsername?: string }>;
  setBannedPlayersInfo: React.Dispatch<React.SetStateAction<Record<string, { discordNickname?: string; discordUsername?: string }>>>;
  playerSearch: string;
  searchResults: AdminQueuePlayerSearchHit[];
  savingBannedPlayers: boolean;
  managingBannedPlayersQueue: AdminQueueRecord | null;
  bannedPlayersDialogOpen: Record<string, boolean>;
  openBannedPlayersDialogForQueue: (queue: AdminQueueRecord) => Promise<void>;
  handleBannedPlayerSearchChange: (search: string) => Promise<void>;
  handleBansDialogOpenChange: (open: boolean) => void;
  saveBannedPlayersList: () => Promise<void>;
}

export function useQueueBans(
  queues: RuntimeQueue[],
  setQueues: React.Dispatch<React.SetStateAction<RuntimeQueue[]>>,
): UseQueueBansResult {
  const { toast } = useToast();
  const [bannedPlayers, setBannedPlayers] = useState<string[]>([]);
  const [bannedPlayersInfo, setBannedPlayersInfo] = useState<
    Record<string, { discordNickname?: string; discordUsername?: string }>
  >({});
  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AdminQueuePlayerSearchHit[]>([]);
  const [savingBannedPlayers, setSavingBannedPlayers] = useState(false);
  const [managingBannedPlayersQueue, setManagingBannedPlayersQueue] =
    useState<AdminQueueRecord | null>(null);
  const [bannedPlayersDialogOpen, setBannedPlayersDialogOpen] = useState<
    Record<string, boolean>
  >({});

  const openBannedPlayersDialogForQueue = useCallback(
    async (queue: AdminQueueRecord) => {
      setManagingBannedPlayersQueue(queue);
      const banned = queue.bannedPlayers ?? [];
      setBannedPlayers(banned);
      setPlayerSearch("");
      setSearchResults([]);

      const info: Record<string, { discordNickname?: string; discordUsername?: string }> = {};
      for (const discordId of banned) {
        try {
          const response = await fetch(`/api/players/search?q=${encodeURIComponent(discordId)}`);
          if (response.ok) {
            const data = (await response.json()) as { players?: Array<{ discordId: string; discordNickname?: string; discordUsername?: string }> };
            const player = data.players?.find((p) => p.discordId === discordId);
            if (player) {
              info[discordId] = {
                discordNickname: player.discordNickname,
                discordUsername: player.discordUsername,
              };
            }
          }
        } catch (error) {
          safeLog.error("Error fetching player info:", error);
        }
      }
      setBannedPlayersInfo(info);
      setBannedPlayersDialogOpen((prev) => ({ ...prev, [queue._id]: true }));
    },
    [],
  );

  const handleBannedPlayerSearchChange = useCallback(async (search: string) => {
    setPlayerSearch(search);
    if (search.length >= 3) {
      try {
        const response = await fetch(`/api/players/search?q=${encodeURIComponent(search)}`);
        if (response.ok) {
          const data = (await response.json()) as { players?: AdminQueuePlayerSearchHit[] };
          setSearchResults(data.players ?? []);
        }
      } catch (error) {
        safeLog.error("Error searching players:", error);
      }
    } else {
      setSearchResults([]);
    }
  }, []);

  const handleBansDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && managingBannedPlayersQueue) {
        setBannedPlayersDialogOpen((prev) => ({ ...prev, [managingBannedPlayersQueue._id]: false }));
        setManagingBannedPlayersQueue(null);
        setBannedPlayers([]);
        setPlayerSearch("");
        setSearchResults([]);
      }
    },
    [managingBannedPlayersQueue],
  );

  const saveBannedPlayersList = useCallback(async () => {
    if (!managingBannedPlayersQueue) return;
    setSavingBannedPlayers(true);
    try {
      const response = await fetch(
        `/api/admin/queues/${managingBannedPlayersQueue._id}/banned-players`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bannedPlayers }),
        },
      );
      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to update");
      }
      setQueues((prev) =>
        prev.map((q) =>
          q._id === managingBannedPlayersQueue._id ? { ...q, bannedPlayers } : q,
        ),
      );
      toast({ title: "Success", description: "Banned players updated successfully" });
      setBannedPlayersDialogOpen((prev) => ({ ...prev, [managingBannedPlayersQueue._id]: false }));
      setManagingBannedPlayersQueue(null);
      setBannedPlayers([]);
      setPlayerSearch("");
      setSearchResults([]);
    } catch (error: unknown) {
      safeLog.error("Error updating banned players:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update banned players",
        variant: "destructive",
      });
    } finally {
      setSavingBannedPlayers(false);
    }
  }, [managingBannedPlayersQueue, bannedPlayers, setQueues, toast]);

  return {
    bannedPlayers,
    setBannedPlayers,
    bannedPlayersInfo,
    setBannedPlayersInfo,
    playerSearch,
    searchResults,
    savingBannedPlayers,
    managingBannedPlayersQueue,
    bannedPlayersDialogOpen,
    openBannedPlayersDialogForQueue,
    handleBannedPlayerSearchChange,
    handleBansDialogOpenChange,
    saveBannedPlayersList,
  };
}
