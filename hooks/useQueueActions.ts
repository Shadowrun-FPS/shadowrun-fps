"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { safeLog } from "@/lib/security";
import {
  adminClearQueueErrorToast,
  adminDeleteQueueErrorToast,
  adminFillQueueErrorToast,
  joinQueueErrorToast,
  launchMatchErrorToast,
  leaveQueueErrorToast,
  queueApiNetworkErrorToast,
} from "@/lib/queue-page-toast-messages";
import type { RuntimeQueue, QueuePlayer } from "@/types/admin-queue";
import type { Session } from "next-auth";

export interface RemovePlayerPayload {
  queueId: string;
  playerId: string;
  playerName: string;
}

export interface DeleteQueuePayload {
  queueId: string;
  name: string;
  eloTier?: string;
  teamSize?: number;
}

interface UseQueueActionsResult {
  joiningQueue: string | null;
  leavingQueue: string | null;
  pendingOperations: Set<string>;
  playerToRemove: RemovePlayerPayload | null;
  queueToDelete: DeleteQueuePayload | null;
  setPlayerToRemove: (v: RemovePlayerPayload | null) => void;
  setQueueToDelete: (v: DeleteQueuePayload | null) => void;
  handleJoinQueue: (queueId: string) => Promise<void>;
  handleLeaveQueue: (queueId: string) => Promise<void>;
  handleLaunchMatch: (queueId: string) => Promise<void>;
  handleFillQueue: (queueId: string, reshuffle?: boolean) => Promise<void>;
  handleClearQueue: (queueId: string) => Promise<void>;
  handleRemovePlayer: (queueId: string, playerId: string, playerName: string) => void;
  confirmRemovePlayer: () => Promise<void>;
  handleDeleteQueue: (queueId: string, name: string, eloTier: string, teamSize: number) => void;
  confirmDeleteQueue: () => Promise<void>;
  copyToClipboard: (text: string) => void;
}

export function useQueueActions(
  session: Session | null,
  queues: RuntimeQueue[],
  setQueues: React.Dispatch<React.SetStateAction<RuntimeQueue[]>>,
): UseQueueActionsResult {
  const { toast } = useToast();
  const router = useRouter();
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);
  const [leavingQueue, setLeavingQueue] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  const [lastActionTime, setLastActionTime] = useState<Record<string, number>>({});
  const [playerToRemove, setPlayerToRemove] = useState<RemovePlayerPayload | null>(null);
  const [queueToDelete, setQueueToDelete] = useState<DeleteQueuePayload | null>(null);

  const isThrottled = useCallback(
    (queueId: string): boolean => {
      const now = Date.now();
      const last = lastActionTime[queueId] ?? 0;
      return now - last < 500;
    },
    [lastActionTime],
  );

  const markPending = useCallback((queueId: string) => {
    const now = Date.now();
    setPendingOperations((prev) => new Set(prev).add(queueId));
    setLastActionTime((prev) => ({ ...prev, [queueId]: now }));
  }, []);

  const clearPending = useCallback((queueId: string) => {
    setTimeout(() => {
      setPendingOperations((prev) => {
        const next = new Set(prev);
        next.delete(queueId);
        return next;
      });
    }, 500);
  }, []);

  const handleJoinQueue = useCallback(
    async (queueId: string) => {
      if (!session?.user) return;
      if (isThrottled(queueId) || pendingOperations.has(queueId) || joiningQueue || leavingQueue) return;

      const target = queues.find((q) => q._id === queueId);
      if (target?.players.some((p: QueuePlayer) => p.discordId === session.user.id)) {
        toast({ title: "Already in queue", description: "You are already in this queue", duration: 2000 });
        return;
      }

      markPending(queueId);
      setJoiningQueue(queueId);

      const optimistic: QueuePlayer = {
        discordId: session.user.id,
        discordUsername: session.user.name ?? "",
        discordNickname: session.user.nickname ?? session.user.name ?? "",
        discordProfilePicture: session.user.image ?? "",
        joinedAt: Date.now(),
        elo: 0,
      };
      setQueues((prev) =>
        prev.map((q) =>
          q._id === queueId ? { ...q, players: [...(q.players ?? []), optimistic] } : q,
        ),
      );
      const revert = () =>
        setQueues((prev) =>
          prev.map((q) =>
            q._id === queueId
              ? { ...q, players: (q.players ?? []).filter((p) => p.discordId !== session.user.id) }
              : q,
          ),
        );

      try {
        const response = await fetch(`/api/queues/${queueId}/join`, { method: "POST" });
        let data: { error?: string } = {};
        try { data = await response.json(); } catch { /* non-JSON */ }
        if (!response.ok) {
          revert();
          const { title, description } = joinQueueErrorToast(response.status, typeof data.error === "string" ? data.error : undefined);
          toast({ title, description, variant: "destructive", duration: 4000 });
          return;
        }
        toast({ title: "You're in", description: "Joined the queue successfully.", duration: 2000 });
      } catch (error) {
        revert();
        safeLog.error("Error joining queue:", error);
        const { title, description } = queueApiNetworkErrorToast();
        toast({ title, description, variant: "destructive", duration: 4000 });
      } finally {
        setJoiningQueue(null);
        clearPending(queueId);
      }
    },
    [session, queues, setQueues, joiningQueue, leavingQueue, pendingOperations, isThrottled, markPending, clearPending, toast],
  );

  const handleLeaveQueue = useCallback(
    async (queueId: string) => {
      if (!session?.user) return;
      if (isThrottled(queueId) || pendingOperations.has(queueId) || joiningQueue || leavingQueue) return;

      const target = queues.find((q) => q._id === queueId);
      if (!target?.players.some((p: QueuePlayer) => p.discordId === session.user.id)) {
        toast({ title: "Not in queue", description: "You are not in this queue", duration: 2000 });
        return;
      }

      markPending(queueId);
      setLeavingQueue(queueId);
      const previousQueues = queues;
      setQueues((prev) =>
        prev.map((q) =>
          q._id === queueId
            ? { ...q, players: (q.players ?? []).filter((p) => p.discordId !== session.user.id) }
            : q,
        ),
      );

      try {
        const response = await fetch(`/api/queues/${queueId}/leave`, { method: "POST" });
        let data: { error?: string } = {};
        try { data = await response.json(); } catch { /* non-JSON */ }
        if (!response.ok) {
          setQueues(previousQueues);
          const { title, description } = leaveQueueErrorToast(response.status, typeof data.error === "string" ? data.error : undefined);
          toast({ title, description, variant: "destructive", duration: 4000 });
          return;
        }
        toast({ title: "Left queue", description: "You've been removed from this queue.", duration: 2000 });
      } catch (error) {
        setQueues(previousQueues);
        safeLog.error("Error leaving queue:", error);
        const { title, description } = queueApiNetworkErrorToast();
        toast({ title, description, variant: "destructive", duration: 4000 });
      } finally {
        setLeavingQueue(null);
        clearPending(queueId);
      }
    },
    [session, queues, setQueues, joiningQueue, leavingQueue, pendingOperations, isThrottled, markPending, clearPending, toast],
  );

  const handleLaunchMatch = useCallback(
    async (queueId: string) => {
      try {
        const response = await fetch(`/api/queues/${queueId}/launch`, { method: "POST" });
        let data: { error?: string; matchId?: string } = {};
        try { data = await response.json(); } catch { /* non-JSON */ }
        if (!response.ok) {
          const { title, description } = launchMatchErrorToast(response.status, typeof data.error === "string" ? data.error : undefined);
          toast({ title, description, variant: "destructive", duration: 4000 });
          return;
        }
        if (data.matchId) router.push(`/matches/${data.matchId}`);
        toast({ title: "Match launched", description: "The match was created successfully.", duration: 3000 });
      } catch (error) {
        safeLog.error("Error launching match:", error);
        const { title, description } = queueApiNetworkErrorToast();
        toast({ title, description, variant: "destructive", duration: 4000 });
      }
    },
    [router, toast],
  );

  const handleFillQueue = useCallback(
    async (queueId: string, reshuffle = false) => {
      if (!session?.user) return;
      setJoiningQueue(queueId);
      try {
        const url = reshuffle ? `/api/queues/${queueId}/fill?reshuffle=true` : `/api/queues/${queueId}/fill`;
        const response = await fetch(url, { method: "POST" });
        let data: { error?: string; message?: string } = {};
        try { data = await response.json(); } catch { /* non-JSON */ }
        if (!response.ok) {
          const { title, description } = adminFillQueueErrorToast(response.status, typeof data.error === "string" ? data.error : undefined);
          toast({ title, description, variant: "destructive", duration: 4000 });
          return;
        }
        const msgLower = (data.message ?? "").toLowerCase();
        if (msgLower.includes("already full")) {
          toast({ title: "Queue is already full", description: typeof data.message === "string" ? data.message : "There are no empty slots to fill.", duration: 3500 });
          return;
        }
        toast({ title: "Queue filled", description: typeof data.message === "string" ? data.message : "Players were added to the queue.", duration: 2500 });
      } catch (error) {
        safeLog.error("Fill queue:", error);
        const { title, description } = queueApiNetworkErrorToast();
        toast({ title, description, variant: "destructive", duration: 4000 });
      } finally {
        setJoiningQueue(null);
      }
    },
    [session, toast],
  );

  const handleClearQueue = useCallback(
    async (queueId: string) => {
      if (!session?.user) return;
      setJoiningQueue(queueId);
      try {
        const response = await fetch(`/api/queues/${queueId}/clear`, { method: "POST" });
        let data: { error?: string } = {};
        try { data = await response.json(); } catch { /* non-JSON */ }
        if (!response.ok) {
          const { title, description } = adminClearQueueErrorToast(response.status, typeof data.error === "string" ? data.error : undefined);
          toast({ title, description, variant: "destructive", duration: 4000 });
          return;
        }
        toast({ title: "Queue cleared", description: "All players have been removed from this queue.", duration: 2000 });
      } catch (error) {
        safeLog.error("Clear queue:", error);
        const { title, description } = queueApiNetworkErrorToast();
        toast({ title, description, variant: "destructive", duration: 4000 });
      } finally {
        setJoiningQueue(null);
      }
    },
    [session, toast],
  );

  const handleRemovePlayer = useCallback(
    (queueId: string, playerId: string, playerName: string) => {
      setPlayerToRemove({ queueId, playerId, playerName });
    },
    [],
  );

  const confirmRemovePlayer = useCallback(async () => {
    if (!playerToRemove || !session?.user) return;
    setJoiningQueue(playerToRemove.queueId);
    try {
      const response = await fetch(`/api/queues/${playerToRemove.queueId}/remove-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerToRemove.playerId }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to remove player");
      }
      toast({ title: "Player Removed", description: `${playerToRemove.playerName} has been removed from the queue`, duration: 3000 });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to remove player", variant: "destructive", duration: 3000 });
    } finally {
      setJoiningQueue(null);
      setPlayerToRemove(null);
    }
  }, [playerToRemove, session, toast]);

  const handleDeleteQueue = useCallback(
    (queueId: string, name: string, eloTier: string, teamSize: number) => {
      setQueueToDelete({ queueId, name, eloTier, teamSize });
    },
    [],
  );

  const confirmDeleteQueue = useCallback(async () => {
    if (!queueToDelete || !session?.user) return;
    setJoiningQueue(queueToDelete.queueId);
    try {
      const response = await fetch(`/api/queues/${queueToDelete.queueId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      let data: { error?: string } = {};
      try { data = await response.json(); } catch { /* non-JSON */ }
      if (!response.ok) {
        const { title, description } = adminDeleteQueueErrorToast(response.status, typeof data.error === "string" ? data.error : undefined);
        toast({ title, description, variant: "destructive", duration: 4000 });
        return;
      }
      toast({ title: "Queue deleted", description: `"${queueToDelete.name}" was removed.`, duration: 3000 });
    } catch (error) {
      safeLog.error("Delete queue:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({ title, description, variant: "destructive", duration: 4000 });
    } finally {
      setJoiningQueue(null);
      setQueueToDelete(null);
    }
  }, [queueToDelete, session, toast]);

  const copyToClipboard = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard", description: "Queue ID has been copied to clipboard", duration: 3000 });
    },
    [toast],
  );

  return {
    joiningQueue,
    leavingQueue,
    pendingOperations,
    playerToRemove,
    queueToDelete,
    setPlayerToRemove,
    setQueueToDelete,
    handleJoinQueue,
    handleLeaveQueue,
    handleLaunchMatch,
    handleFillQueue,
    handleClearQueue,
    handleRemovePlayer,
    confirmRemovePlayer,
    handleDeleteQueue,
    confirmDeleteQueue,
    copyToClipboard,
  };
}
