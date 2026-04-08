"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { FeatureGate } from "@/components/feature-gate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusCircle, ChevronDown, Loader2 } from "lucide-react";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SECURITY_CONFIG, isSessionAdminUser } from "@/lib/security-config";
import { safeLog } from "@/lib/security";
import { cn } from "@/lib/utils";
import { QueueCard } from "@/components/queues/queue-card";
import { AdminQueueMapPoolDialog } from "@/components/admin/queues/admin-queue-map-pool-dialog";
import { AdminQueueBansDialog } from "@/components/admin/queues/admin-queue-bans-dialog";
import type {
  AdminQueueMapVariant,
  AdminQueuePlayerSearchHit,
  AdminQueueRecord,
} from "@/types/admin-queue";
import {
  adminClearQueueErrorToast,
  adminDeleteQueueErrorToast,
  adminFillQueueErrorToast,
  adminMapPoolErrorToast,
  joinQueueErrorToast,
  leaveQueueErrorToast,
  launchMatchErrorToast,
  queueApiNetworkErrorToast,
  registrationErrorToast,
} from "@/lib/queue-page-toast-messages";

/*
  TODO SIN: Define a single source of truth for the Queue, QueuePlayer, etc. types
  I see QueuePlayer defined in multiple places, Let's define it once and import it where needed.
  This will help ensure that the types are consistent across the application. Frotend, backend, and make it easier to update them in the future

  Look into defining these types in a shared file like types.ts or models.ts, then import them where needed.
  Can use mongoose models as a reference for the types
*/
interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number;
}

interface Queue {
  _id: string;
  queueId: string;
  gameType: string;
  teamSize: number;
  players: QueuePlayer[];
  eloTier?: string;
  minElo: number;
  maxElo: number;
  status: "active" | "inactive";
  requiredRoles?: string[];
  requiredRoleNames?: string[];
  // TODO(queue-privacy): When `hidePlayerElo` exists on queue documents, add it here and pass
  // `hidePlayerElo` through to <QueueCard /> (see admin Edit Queue + PATCH details API).
}

const ELO_TIER_PRESETS = {
  low: { minElo: 0, maxElo: 1499 },
  mid: { minElo: 1500, maxElo: 2199 },
  high: { minElo: 2200, maxElo: 5000 },
} as const;

const CREATE_QUEUE_TIER_NONE = "__none__" as const;

const createQueueSchema = z
  .object({
    teamSize: z.enum(["1", "2", "4", "5", "8"]),
    eloTier: z.enum(["low", "mid", "high", CREATE_QUEUE_TIER_NONE]),
    minElo: z.coerce.number().min(0).max(5000),
    maxElo: z.coerce.number().min(0).max(5000),
  })
  .refine((data) => data.minElo < data.maxElo, {
    message: "Min ELO must be less than max ELO",
    path: ["minElo"],
  });

type CreateQueueFormValues = z.infer<typeof createQueueSchema>;

const DEFAULT_CREATE_QUEUE_VALUES: CreateQueueFormValues = {
  teamSize: "4",
  eloTier: CREATE_QUEUE_TIER_NONE,
  minElo: ELO_TIER_PRESETS.mid.minElo,
  maxElo: ELO_TIER_PRESETS.mid.maxElo,
};

export default function QueuesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [queues, setQueues] = useState<Array<any>>([]);
  const [activeTab, setActiveTab] = useState<string>("4v4");
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);
  const [leavingQueue, setLeavingQueue] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(
    new Set(),
  );
  const [lastActionTime, setLastActionTime] = useState<Record<string, number>>(
    {},
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<{
    queueId: string;
    playerId: string;
    playerName: string;
  } | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isCheckingRegistration, setIsCheckingRegistration] =
    useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [missingTeamSizes, setMissingTeamSizes] = useState<number[]>([]);
  const [isRegisteringMissing, setIsRegisteringMissing] =
    useState<boolean>(false);
  const router = useRouter();
  const [queueToDelete, setQueueToDelete] = useState<{
    queueId: string;
    name: string;
    eloTier?: string;
    teamSize?: number;
  } | null>(null);

  // Manage Maps state
  const [maps, setMaps] = useState<any[]>([]);
  const [originalMaps, setOriginalMaps] = useState<any[]>([]);
  const [selectedMaps, setSelectedMaps] = useState<Record<string, string[]>>(
    {},
  );
  const [managingMapsQueue, setManagingMapsQueue] = useState<any | null>(null);
  const [mapsDialogOpen, setMapsDialogOpen] = useState<Record<string, boolean>>(
    {},
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [mapPoolSearch, setMapPoolSearch] = useState("");
  const [managingBannedPlayersQueue, setManagingBannedPlayersQueue] =
    useState<AdminQueueRecord | null>(null);
  const [bannedPlayersDialogOpen, setBannedPlayersDialogOpen] = useState<
    Record<string, boolean>
  >({});
  const [bannedPlayers, setBannedPlayers] = useState<string[]>([]);
  const [bannedPlayersInfo, setBannedPlayersInfo] = useState<
    Record<string, { discordNickname?: string; discordUsername?: string }>
  >({});
  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    AdminQueuePlayerSearchHit[]
  >([]);
  const [savingBannedPlayers, setSavingBannedPlayers] = useState(false);

  const mapPoolDialogFilteredMaps = useMemo(() => {
    const q = mapPoolSearch.trim().toLowerCase();
    const list = maps as AdminQueueMapVariant[];
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.gameMode.toLowerCase().includes(q),
    );
  }, [maps, mapPoolSearch]);

  // Create queue form
  const form = useForm<CreateQueueFormValues>({
    resolver: zodResolver(createQueueSchema),
    defaultValues: DEFAULT_CREATE_QUEUE_VALUES,
  });

  // Check if user is admin
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (session?.user?.id) {
        try {
          // ✅ Use unified endpoint with deduplication
          const { deduplicatedFetch } =
            await import("@/lib/request-deduplication");
          const userData = await deduplicatedFetch<{ roles: string[] }>(
            "/api/user/data",
            {
              ttl: 60000, // Cache for 1 minute
            },
          );
          setUserRoles(userData.roles || []);
        } catch (error) {
          // Silently handle errors
        }
      }
    };
    fetchRoles();
  }, [session?.user?.id]);

  const isAdmin = useCallback(() => {
    if (!session?.user) return false;
    const roles = userRoles.length > 0 ? userRoles : session?.user?.roles || [];
    return isSessionAdminUser(session.user, roles);
  }, [
    session?.user,
    session?.user?.roles,
    userRoles,
  ]);

  // Update the isAdmin function to also check for moderator role
  const isAdminOrMod = () => {
    return (
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("moderator")))
    );
  };

  useEffect(() => {
    if (!session?.user) return;

    // Initial fetch - use deduplication
    const fetchQueues = async () => {
      try {
        const { deduplicatedFetch } =
          await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<any[]>("/api/queues", {
          ttl: 10000, // Cache for 10 seconds (queues change frequently)
        });
        setQueues(data);
      } catch (error) {
        safeLog.error("Error fetching queues:", error);
      }
    };

    fetchQueues();

    // Fetch maps for manage maps functionality (only if user has permission)
    const fetchMaps = async () => {
      try {
        const response = await fetch("/api/maps");
        if (!response.ok) throw new Error("Failed to fetch maps");
        const mapsData = await response.json();
        setOriginalMaps(mapsData);

        // Create map variants (normal and small if applicable)
        const mapsWithVariants: any[] = [];
        for (const map of mapsData) {
          mapsWithVariants.push({
            ...map,
            _id: `${map._id}-normal`,
            name: map.name,
            src: `/maps/map_${map.name.toLowerCase().replace(/\s+/g, "")}.png`,
          });

          if (map.smallOption) {
            mapsWithVariants.push({
              ...map,
              _id: `${map._id}-small`,
              name: `${map.name} (Small)`,
              src: `/maps/map_${map.name
                .toLowerCase()
                .replace(/\s+/g, "")}.png`,
            });
          }
        }
        setMaps(mapsWithVariants);
      } catch (error) {
        safeLog.error("Error fetching maps:", error);
      }
    };

    // Check if user can manage maps
    const roles = userRoles.length > 0 ? userRoles : session?.user?.roles || [];
    const isDeveloper =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session?.user?.id === "238329746671271936";
    const hasModeratorRole = roles.includes(SECURITY_CONFIG.ROLES.MODERATOR);
    const hasAdminRole = roles.includes(SECURITY_CONFIG.ROLES.ADMIN);
    const hasFounderRole = roles.includes(SECURITY_CONFIG.ROLES.FOUNDER);
    const canManage =
      isDeveloper ||
      isAdmin() ||
      hasModeratorRole ||
      hasAdminRole ||
      hasFounderRole ||
      session?.user?.isAdmin;

    if (canManage) {
      fetchMaps();
    }

    // Hybrid approach: SSE for real-time updates, polling as fallback
    // This ensures users always have fresh data, even if SSE disconnects overnight
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let pollingInterval: ReturnType<typeof setTimeout> | null = null;
    let heartbeatCheckInterval: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let isPollingActive = false;
    let lastHeartbeat = Date.now();
    let isSSEConnected = false;
    const maxReconnectAttempts = 5; // Reduced since we have polling fallback
    const baseReconnectDelay = 2000; // Start with 2 seconds
    const pollingIntervalMs = 20000; // Poll every 20 seconds as fallback (increased to reduce rate limiting)
    const heartbeatTimeoutMs = 30000; // If no heartbeat for 30s, assume SSE is dead

    // Polling function - fetches queues via regular API
    const pollQueues = async () => {
      // Only poll if page is visible (save resources when tab is in background)
      if (document.hidden) return;

      try {
        const { deduplicatedFetch } =
          await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<any[]>("/api/queues", {
          ttl: 10000, // Cache for 10 seconds
        });
        setQueues(data);
      } catch (error) {
        safeLog.error("Error polling queues:", error);
      }
    };

    // Start polling fallback
    const startPolling = () => {
      if (isPollingActive) return; // Already polling

      isPollingActive = true;
      // Poll immediately, then at intervals
      pollQueues();
      pollingInterval = setInterval(() => {
        pollQueues();
      }, pollingIntervalMs);
    };

    // Stop polling fallback
    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      isPollingActive = false;
    };

    // Check if SSE is still alive by monitoring heartbeats
    const startHeartbeatMonitoring = () => {
      if (heartbeatCheckInterval) {
        clearInterval(heartbeatCheckInterval);
      }

      heartbeatCheckInterval = setInterval(() => {
        const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;

        // If no heartbeat for too long and SSE claims to be connected, start polling
        if (
          timeSinceLastHeartbeat > heartbeatTimeoutMs &&
          isSSEConnected &&
          !isPollingActive
        ) {
          safeLog.log(
            "SSE appears dead (no heartbeat), starting polling fallback",
          );
          isSSEConnected = false;
          startPolling();
        }
      }, 10000); // Check every 10 seconds
    };

    const connectSSE = () => {
      // Close existing connection if any
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      // Clear any pending reconnection
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      try {
        eventSource = new EventSource("/api/queues/events");

        eventSource.onopen = () => {
          // Connection established, reset reconnect attempts and stop polling
          reconnectAttempts = 0;
          isSSEConnected = true;
          lastHeartbeat = Date.now();
          stopPolling(); // SSE is working, no need for polling
          startHeartbeatMonitoring(); // Start monitoring SSE health
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Update heartbeat timestamp (confirms connection is alive)
            if (data.type === "heartbeat") {
              lastHeartbeat = Date.now();
              return;
            }

            // Handle error messages from server
            if (data.type === "error") {
              safeLog.error("SSE server error:", data.message);
              return;
            }

            // Update queues if we received an array
            if (Array.isArray(data)) {
              setQueues(data);
            }
          } catch (error) {
            safeLog.error("Error parsing SSE data:", error);
          }
        };

        eventSource.onerror = (error) => {
          // Mark SSE as disconnected
          isSSEConnected = false;

          // Close the connection
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          // If SSE fails multiple times, start polling as fallback
          if (reconnectAttempts >= 2 && !isPollingActive) {
            startPolling(); // Start polling fallback after 2 failed attempts
          }

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(
              baseReconnectDelay * Math.pow(2, reconnectAttempts),
              30000, // Max 30 seconds
            );

            reconnectAttempts++;
            reconnectTimeout = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            // Max reconnection attempts reached, rely on polling
            if (!isPollingActive) {
              startPolling();
            }
          }
        };
      } catch (error) {
        safeLog.error("Error creating SSE connection:", error);
        // Retry connection, but start polling if this keeps failing
        if (reconnectAttempts >= 2 && !isPollingActive) {
          startPolling();
        }

        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttempts),
            30000,
          );
          reconnectAttempts++;
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, delay);
        } else if (!isPollingActive) {
          startPolling();
        }
      }
    };

    // Start the SSE connection
    // If it fails, polling will kick in automatically
    connectSSE();

    // Start heartbeat monitoring
    startHeartbeatMonitoring();

    // Handle page visibility changes - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden && isPollingActive) {
        // Page hidden, but keep polling interval (it will skip if hidden)
        // This way we resume immediately when page becomes visible
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (heartbeatCheckInterval) {
        clearInterval(heartbeatCheckInterval);
        heartbeatCheckInterval = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, [session?.user, userRoles, isAdmin]);

  const handleJoinQueue = async (queueId: string) => {
    if (!session?.user) return;

    // Prevent spam: Check if there's a recent action on this queue (within 500ms)
    const now = Date.now();
    const lastAction = lastActionTime[queueId] || 0;
    if (now - lastAction < 500) {
      return; // Too soon, ignore the click
    }

    // Check if already processing an operation for this queue
    if (pendingOperations.has(queueId) || joiningQueue || leavingQueue) {
      return;
    }

    // Check if player is already in this queue
    const queueToJoin = queues.find((q) => q._id === queueId);
    const alreadyInQueue = queueToJoin?.players.some(
      (p: QueuePlayer) => p.discordId === session.user.id,
    );

    if (alreadyInQueue) {
      toast({
        title: "Already in queue",
        description: "You are already in this queue",
        duration: 2000,
      });
      return;
    }

    // Mark operation as pending
    setPendingOperations((prev) => new Set(prev).add(queueId));
    setJoiningQueue(queueId);
    setLastActionTime((prev) => ({ ...prev, [queueId]: now }));

    // Optimistic update: Add player to queue immediately
    const optimisticPlayer = {
      discordId: session.user.id,
      discordUsername: session.user.name || "",
      discordNickname: session.user.nickname || session.user.name || "",
      discordProfilePicture: session.user.image || "",
      joinedAt: Date.now(),
      elo: 0, // Will be updated by server response
    };

    setQueues((prevQueues) =>
      prevQueues.map((q) =>
        q._id === queueId
          ? {
              ...q,
              players: [...(q.players || []), optimisticPlayer],
            }
          : q,
      ),
    );

    const revertOptimisticJoin = () =>
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q._id === queueId
            ? {
                ...q,
                players: (q.players || []).filter(
                  (p: QueuePlayer) => p.discordId !== session.user.id,
                ),
              }
            : q,
        ),
      );

    try {
      const response = await fetch(`/api/queues/${queueId}/join`, {
        method: "POST",
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON or empty body */
      }

      if (!response.ok) {
        revertOptimisticJoin();
        safeLog.error("Join queue failed:", response.status, data);
        const { title, description } = joinQueueErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      toast({
        title: "You're in",
        description: "Joined the queue successfully.",
        duration: 2000,
      });
    } catch (error) {
      revertOptimisticJoin();
      safeLog.error("Error joining queue:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      // Clear pending state after a delay
      setTimeout(() => {
        setJoiningQueue(null);
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(queueId);
          return next;
        });
      }, 500);
    }
  };

  const handleLeaveQueue = async (queueId: string) => {
    if (!session?.user) return;

    // Prevent spam: Check if there's a recent action on this queue (within 500ms)
    const now = Date.now();
    const lastAction = lastActionTime[queueId] || 0;
    if (now - lastAction < 500) {
      return; // Too soon, ignore the click
    }

    // Check if already processing an operation for this queue
    if (pendingOperations.has(queueId) || joiningQueue || leavingQueue) {
      return;
    }

    // Check if player is actually in this queue
    const queueToLeave = queues.find((q) => q._id === queueId);
    const isInQueue = queueToLeave?.players.some(
      (p: QueuePlayer) => p.discordId === session.user.id,
    );

    if (!isInQueue) {
      toast({
        title: "Not in queue",
        description: "You are not in this queue",
        duration: 2000,
      });
      return;
    }

    // Mark operation as pending
    setPendingOperations((prev) => new Set(prev).add(queueId));
    setLeavingQueue(queueId);
    setLastActionTime((prev) => ({ ...prev, [queueId]: now }));

    // Optimistic update: Remove player from queue immediately
    const previousQueues = queues;
    setQueues((prevQueues) =>
      prevQueues.map((q) =>
        q._id === queueId
          ? {
              ...q,
              players: (q.players || []).filter(
                (p: QueuePlayer) => p.discordId !== session.user.id,
              ),
            }
          : q,
      ),
    );

    try {
      const response = await fetch(`/api/queues/${queueId}/leave`, {
        method: "POST",
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        setQueues(previousQueues);
        safeLog.error("Leave queue failed:", response.status, data);
        const { title, description } = leaveQueueErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      toast({
        title: "Left queue",
        description: "You’ve been removed from this queue.",
        duration: 2000,
      });
    } catch (error) {
      setQueues(previousQueues);
      safeLog.error("Error leaving queue:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      // Clear pending state after a delay
      setTimeout(() => {
        setLeavingQueue(null);
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(queueId);
          return next;
        });
      }, 500);
    }
  };

  const isPlayerInQueue = (queue: Queue) => {
    return queue.players.some((p) => p.discordId === session?.user?.id);
  };

  const hasRequiredPlayers = (queue: Queue) => {
    const { activePlayers } = getQueueSections(queue);
    return activePlayers.length >= queue.teamSize * 2;
  };

  const handleLaunchMatch = async (queueId: string) => {
    safeLog.log("Launch match attempt:", {
      sessionData: session,
      userId: session?.user?.id,
    });
    try {
      const response = await fetch(`/api/queues/${queueId}/launch`, {
        method: "POST",
      });

      let data: { error?: string; matchId?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        const { title, description } = launchMatchErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      if (data.matchId) {
        router.push(`/matches/${data.matchId}`);
      }

      toast({
        title: "Match launched",
        description: "The match was created successfully.",
        duration: 3000,
      });
    } catch (error) {
      safeLog.error("Error launching match:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  // Update handleFillQueue to include reshuffle parameter
  const handleFillQueue = async (queueId: string, reshuffle = false) => {
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const url = reshuffle
        ? `/api/queues/${queueId}/fill?reshuffle=true`
        : `/api/queues/${queueId}/fill`;

      const response = await fetch(url, {
        method: "POST",
      });

      let data: { error?: string; message?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        safeLog.error("Fill queue failed:", response.status, data);
        const { title, description } = adminFillQueueErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      const messageLower = (data.message ?? "").toString().toLowerCase();
      if (messageLower.includes("already full")) {
        toast({
          title: "Queue is already full",
          description:
            typeof data.message === "string"
              ? data.message
              : "There are no empty slots to fill.",
          duration: 3500,
        });
        return;
      }

      toast({
        title: "Queue filled",
        description:
          typeof data.message === "string"
            ? data.message
            : "Players were added to the queue.",
        duration: 2500,
      });
    } catch (error) {
      safeLog.error("Fill queue:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  // Add this function after handleFillQueue
  const handleClearQueue = async (queueId: string) => {
    safeLog.log("Clear queue attempt:", {
      sessionData: session,
      userId: session?.user?.id,
    });
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const response = await fetch(`/api/queues/${queueId}/clear`, {
        method: "POST",
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        safeLog.error("Clear queue failed:", response.status, data);
        const { title, description } = adminClearQueueErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      toast({
        title: "Queue cleared",
        description: "All players have been removed from this queue.",
        duration: 2000,
      });
    } catch (error) {
      safeLog.error("Clear queue:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  // Add state for time updates
  const [, setTimeUpdate] = useState(0);

  // Update times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatJoinTime = (joinedAt: string | number | Date) => {
    try {
      // Handle different date formats and ensure valid date
      const date =
        typeof joinedAt === "number" ? new Date(joinedAt) : new Date(joinedAt);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "just now";
      }

      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      safeLog.error("Error formatting date:", error);
      return "just now";
    }
  };

  // Update the getQueueSections helper to be more dynamic
  const getQueueSections = (queue: Queue) => {
    const requiredPlayers = queue.teamSize * 2;

    // Sort players by join time (first come, first served)
    const sortedPlayers = [...queue.players].sort(
      (a, b) => a.joinedAt - b.joinedAt,
    );

    // First N players are active, rest are waitlisted
    const activePlayers = sortedPlayers.slice(0, requiredPlayers);
    const waitlistPlayers = sortedPlayers.slice(requiredPlayers);

    return { activePlayers, waitlistPlayers };
  };

  // Update the canLaunchMatch function to check for proper roles
  const canLaunchMatch = (queue: Queue) => {
    if (!session?.user?.id) return false;

    // Check if user is developer
    const isDeveloper =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session.user.id === "238329746671271936";

    // Get roles from fetched userRoles or session
    const roles = userRoles.length > 0 ? userRoles : session?.user?.roles || [];

    // Check for required role IDs (GM, moderator, admin, founder)
    const hasGMRole = roles.includes(SECURITY_CONFIG.ROLES.GM);
    const hasModeratorRole = roles.includes(SECURITY_CONFIG.ROLES.MODERATOR);
    const hasAdminRole = roles.includes(SECURITY_CONFIG.ROLES.ADMIN);
    const hasFounderRole = roles.includes(SECURITY_CONFIG.ROLES.FOUNDER);

    // Check if user has any of the required roles
    const hasRequiredRole =
      isDeveloper ||
      hasGMRole ||
      hasModeratorRole ||
      hasAdminRole ||
      hasFounderRole ||
      session.user.isAdmin;

    // Check if queue has enough players
    const hasEnoughPlayers = queue.players.length >= queue.teamSize * 2;

    // Users with required roles can launch even if not in queue
    return Boolean(hasRequiredRole && hasEnoughPlayers);
  };

  // Handle create queue form submission
  const onSubmit = async (values: CreateQueueFormValues) => {
    if (!session?.user) return;

    setIsCreatingQueue(true);

    try {
      const tier =
        values.eloTier !== CREATE_QUEUE_TIER_NONE ? values.eloTier : undefined;
      const response = await fetch("/api/queues/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamSize: parseInt(values.teamSize),
          ...(tier ? { eloTier: tier } : {}),
          minElo: values.minElo,
          maxElo: values.maxElo,
          gameType: "ranked",
          status: "active",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create queue");
      }

      toast({
        title: "Queue Created",
        description: "The queue has been created successfully",
        duration: 3000, // 3 seconds
      });

      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create queue",
        variant: "destructive",
        duration: 3000, // 3 seconds
      });
    } finally {
      setIsCreatingQueue(false);
    }
  };

  // Update the handleRemovePlayer function to use the confirmation dialog
  const handleRemovePlayer = async (
    queueId: string,
    playerId: string,
    playerName: string,
  ) => {
    // Set the player to remove, which will open the confirmation dialog
    setPlayerToRemove({ queueId, playerId, playerName });
  };

  // Add a function to confirm and execute the player removal
  const confirmRemovePlayer = async () => {
    if (!playerToRemove || !session?.user) return;

    setJoiningQueue(playerToRemove.queueId);

    try {
      const response = await fetch(
        `/api/queues/${playerToRemove.queueId}/remove-player`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerId: playerToRemove.playerId }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove player");
      }

      toast({
        title: "Player Removed",
        description: `${playerToRemove.playerName} has been removed from the queue`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove player",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setJoiningQueue(null);
      setPlayerToRemove(null); // Close the dialog
    }
  };

  // Add a function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Queue ID has been copied to clipboard",
      duration: 3000,
    });
  };

  // Add state for waitlist expansion
  const [expandedWaitlists, setExpandedWaitlists] = useState<
    Record<string, boolean>
  >({});

  // Add a function to toggle waitlist expansion
  const toggleWaitlistExpansion = (queueId: string) => {
    setExpandedWaitlists((prev) => ({
      ...prev,
      [queueId]: !prev[queueId],
    }));
  };

  // Add a media query hook to detect mobile devices
  const isMobile = useMediaQuery("(max-width: 768px)");

  // ✅ Optimize: Combine both checks into parallel calls
  const checkUserRegistrationAndTeamSizes = useCallback(async () => {
    if (!session?.user || document.hidden) return;

    setIsCheckingRegistration(true);
    try {
      // ✅ Parallelize both calls
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const [registrationData, teamSizesData] = await Promise.all([
        deduplicatedFetch<{ isRegistered: boolean }>(
          "/api/players/check-registration",
          {
            ttl: 30000, // Cache for 30 seconds
          },
        ).catch(() => ({ isRegistered: false })),
        deduplicatedFetch<{ missingTeamSizes: number[] }>(
          "/api/players/check-missing-teamsizes",
          { ttl: 30000 },
        ).catch(() => ({ missingTeamSizes: [] })),
      ]);

      setIsRegistered(registrationData.isRegistered);
      setMissingTeamSizes(teamSizesData.missingTeamSizes || []);
    } catch (error) {
      safeLog.error("Failed to check registration/team sizes:", error);
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [session?.user]);

  // Only check when page is visible to reduce API calls
  useEffect(() => {
    if (session?.user && !document.hidden) {
      checkUserRegistrationAndTeamSizes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, checkUserRegistrationAndTeamSizes]);

  // Add function to handle registering missing team sizes
  const handleRegisterMissingTeamSizes = async () => {
    if (!session?.user) return;

    setIsRegisteringMissing(true);
    try {
      const response = await fetch(`/api/players/register-missing-teamsizes`, {
        method: "POST",
      });

      let data: {
        error?: string;
        registeredSizes?: number[];
        message?: string;
      } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        const { title, description } = registrationErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      setMissingTeamSizes([]);
      router.refresh();

      const sizes = data.registeredSizes ?? [];
      toast({
        title: "Registration successful",
        description:
          sizes.length > 0
            ? `You’ve been registered for ${sizes
                .map((size: number) => `${size}v${size}`)
                .join(", ")} queues`
            : typeof data.message === "string"
              ? data.message
              : "You’re set for the available queue sizes.",
        duration: 3000,
      });
    } catch (error) {
      safeLog.error("Register missing team sizes:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsRegisteringMissing(false);
    }
  };

  // Add the missing handleRegisterForRanked function
  const handleRegisterForRanked = async () => {
    if (!session?.user) return;

    setIsRegistering(true);
    try {
      const response = await fetch(`/api/players/register`, {
        method: "POST",
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        const { title, description } = registrationErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      setIsRegistered(true);
      toast({
        title: "You’re registered",
        description: "You can join ranked queues for modes you’ve signed up for.",
        duration: 3000,
      });

      checkUserRegistrationAndTeamSizes();
    } catch (error) {
      safeLog.error("Register for ranked:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Check if user is developer (you) or admin
  const isDeveloperOrAdmin = (): boolean => {
    return (
      isAdmin() ||
      (session?.user?.id !== undefined &&
        session.user.id === SECURITY_CONFIG.DEVELOPER_ID)
    );
  };

  // Check if user can manage maps (developer, admin, moderator, or founder)
  const canManageMaps = (): boolean => {
    if (!session?.user) return false;
    const roles = userRoles || session.user.roles || [];
    const isDeveloper =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session.user.id === "238329746671271936";
    const hasModeratorRole = roles.includes(SECURITY_CONFIG.ROLES.MODERATOR);
    const hasAdminRole = roles.includes(SECURITY_CONFIG.ROLES.ADMIN);
    const hasFounderRole = roles.includes(SECURITY_CONFIG.ROLES.FOUNDER);

    return Boolean(
      isDeveloper ||
      isAdmin() ||
      hasModeratorRole ||
      hasAdminRole ||
      hasFounderRole ||
      session.user.isAdmin,
    );
  };

  /** Same access as /admin/queues banned-players API (developer, admin, founder) */
  const canManageQueueBans = (): boolean => {
    if (!session?.user) return false;
    const roles = userRoles || session.user.roles || [];
    const isDeveloper =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session.user.id === "238329746671271936";
    const hasAdminRole = roles.includes(SECURITY_CONFIG.ROLES.ADMIN);
    const hasFounderRole = roles.includes(SECURITY_CONFIG.ROLES.FOUNDER);
    return Boolean(
      isDeveloper || hasAdminRole || hasFounderRole || session.user.isAdmin,
    );
  };

  const openBannedPlayersDialogForQueue = useCallback(
    async (queue: AdminQueueRecord) => {
      setManagingBannedPlayersQueue(queue);
      const banned = queue.bannedPlayers || [];
      setBannedPlayers(banned);
      setPlayerSearch("");
      setSearchResults([]);

      const info: Record<
        string,
        { discordNickname?: string; discordUsername?: string }
      > = {};
      for (const discordId of banned) {
        try {
          const response = await fetch(
            `/api/players/search?q=${encodeURIComponent(discordId)}`,
          );
          if (response.ok) {
            const data = await response.json();
            const player = data.players?.find(
              (p: { discordId: string }) => p.discordId === discordId,
            );
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

      setBannedPlayersDialogOpen((prev) => ({
        ...prev,
        [queue._id]: true,
      }));
    },
    [],
  );

  const handleBannedPlayerSearchChange = useCallback(async (search: string) => {
    setPlayerSearch(search);
    if (search.length >= 3) {
      try {
        const response = await fetch(
          `/api/players/search?q=${encodeURIComponent(search)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.players || []);
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
        setBannedPlayersDialogOpen((prev) => ({
          ...prev,
          [managingBannedPlayersQueue._id]: false,
        }));
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
    try {
      setSavingBannedPlayers(true);
      const response = await fetch(
        `/api/admin/queues/${managingBannedPlayersQueue._id}/banned-players`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bannedPlayers,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      setQueues((prev) =>
        prev.map((q) =>
          q._id === managingBannedPlayersQueue._id
            ? { ...q, bannedPlayers }
            : q,
        ),
      );

      toast({
        title: "Success",
        description: "Banned players updated successfully",
      });

      setBannedPlayersDialogOpen((prev) => ({
        ...prev,
        [managingBannedPlayersQueue._id]: false,
      }));
      setManagingBannedPlayersQueue(null);
      setBannedPlayers([]);
      setPlayerSearch("");
      setSearchResults([]);
    } catch (error: unknown) {
      safeLog.error("Error updating banned players:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update banned players",
        variant: "destructive",
      });
    } finally {
      setSavingBannedPlayers(false);
    }
  }, [managingBannedPlayersQueue, bannedPlayers, toast]);

  const handleMapPoolDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && managingMapsQueue) {
        setMapPoolSearch("");
        setMapsDialogOpen((prev) => ({
          ...prev,
          [managingMapsQueue._id]: false,
        }));
        setManagingMapsQueue(null);
      } else if (open && managingMapsQueue && managingMapsQueue._id) {
        setMapPoolSearch("");
        if (
          !selectedMaps[managingMapsQueue._id] ||
          selectedMaps[managingMapsQueue._id].length === 0
        ) {
          if (
            managingMapsQueue.mapPool &&
            Array.isArray(managingMapsQueue.mapPool)
          ) {
            const variantList = maps as AdminQueueMapVariant[];
            const validVariantIds = managingMapsQueue.mapPool.filter(
              (variantId: string) =>
                variantList.some((m) => m._id === variantId),
            );
            setSelectedMaps((prev) => ({
              ...prev,
              [managingMapsQueue._id]: Array.from(new Set(validVariantIds)),
            }));
          } else if (!managingMapsQueue.mapPool) {
            setSelectedMaps((prev) => ({
              ...prev,
              [managingMapsQueue._id]: (maps as AdminQueueMapVariant[]).map(
                (m) => m._id,
              ),
            }));
          }
        }
      }
    },
    [managingMapsQueue, maps, selectedMaps],
  );

  // Manage Maps functions
  const toggleMapSelection = (queueId: string, mapId: string) => {
    setSelectedMaps((prev) => {
      const current = prev[queueId] || [];
      const updated = current.includes(mapId)
        ? current.filter((id) => id !== mapId)
        : [...current, mapId];
      return {
        ...prev,
        [queueId]: Array.from(new Set(updated)),
      };
    });
  };

  const selectAllMaps = (queueId: string) => {
    setSelectedMaps((prev) => ({
      ...prev,
      [queueId]: maps.map((m) => m._id),
    }));
  };

  const deselectAllMaps = (queueId: string) => {
    setSelectedMaps((prev) => ({
      ...prev,
      [queueId]: [],
    }));
  };

  // Initialize selected maps when managingMapsQueue changes
  useEffect(() => {
    if (managingMapsQueue && maps.length > 0) {
      // Fetch the latest queue data to ensure we have the current mapPool
      const fetchQueueData = async () => {
        try {
          const response = await fetch(
            `/api/admin/queues/${managingMapsQueue._id}/map-pool`,
          );
          if (response.ok) {
            const queueData = await response.json();
            const currentQueue = {
              ...managingMapsQueue,
              mapPool: queueData.mapPool,
            };

            // Always re-initialize selected maps from queue mapPool
            // This ensures the UI reflects the current database state
            if (
              currentQueue.mapPool &&
              Array.isArray(currentQueue.mapPool) &&
              currentQueue.mapPool.length > 0
            ) {
              // Convert map objects to variant IDs for UI state
              const variantIds: string[] = [];
              currentQueue.mapPool.forEach((mapItem: any) => {
                // Handle both old format (variant IDs) and new format (objects)
                if (typeof mapItem === "string") {
                  // Backward compatibility: old format with variant IDs
                  if (maps.some((m) => m._id === mapItem)) {
                    variantIds.push(mapItem);
                  }
                } else if (mapItem && mapItem._id) {
                  // New format: map object
                  const variantId = mapItem.isSmall
                    ? `${mapItem._id}-small`
                    : `${mapItem._id}-normal`;
                  // Verify the variant exists in our maps list
                  if (maps.some((m) => m._id === variantId)) {
                    variantIds.push(variantId);
                  }
                }
              });
              setSelectedMaps((prev) => ({
                ...prev,
                [managingMapsQueue._id]: Array.from(new Set(variantIds)),
              }));
            } else if (
              !currentQueue.mapPool ||
              currentQueue.mapPool.length === 0
            ) {
              // If no map pool, initialize with empty selection (not all maps)
              setSelectedMaps((prev) => ({
                ...prev,
                [managingMapsQueue._id]: [],
              }));
            }
          }
        } catch (error) {
          safeLog.error("Error fetching queue map pool:", error);
          // Fallback to using the queue object's mapPool if available
          if (
            managingMapsQueue.mapPool &&
            Array.isArray(managingMapsQueue.mapPool)
          ) {
            const variantIds: string[] = [];
            managingMapsQueue.mapPool.forEach((mapItem: any) => {
              if (typeof mapItem === "string") {
                if (maps.some((m) => m._id === mapItem)) {
                  variantIds.push(mapItem);
                }
              } else if (mapItem && mapItem._id) {
                const variantId = mapItem.isSmall
                  ? `${mapItem._id}-small`
                  : `${mapItem._id}-normal`;
                if (maps.some((m) => m._id === variantId)) {
                  variantIds.push(variantId);
                }
              }
            });
            setSelectedMaps((prev) => ({
              ...prev,
              [managingMapsQueue._id]: Array.from(new Set(variantIds)),
            }));
          }
        }
      };

      fetchQueueData();
    }
  }, [managingMapsQueue, maps]);

  const handleSaveMaps = async (queue: any): Promise<void> => {
    if (saving[queue._id]) return;

    try {
      setSaving((prev) => ({ ...prev, [queue._id]: true }));

      const selected = selectedMaps[queue._id] || [];
      if (selected.length === 0) {
        toast({
          title: "Select maps first",
          description: "Choose at least one map for this queue's pool.",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      // Convert selected variant IDs to map objects for storage
      const mapPoolItems: any[] = [];
      const processedVariants = new Set<string>();

      selected.forEach((variantId: string) => {
        if (processedVariants.has(variantId)) return;

        let baseId: string;
        let isSmall: boolean;

        if (variantId.includes("-normal")) {
          baseId = variantId.replace("-normal", "");
          isSmall = false;
        } else if (variantId.includes("-small")) {
          baseId = variantId.replace("-small", "");
          isSmall = true;
        } else {
          baseId = variantId;
          isSmall = false;
        }

        const map = originalMaps.find((m) => m._id === baseId);
        if (!map) return;

        if (isSmall && !map.smallOption) {
          return;
        }

        mapPoolItems.push({
          _id: baseId,
          name: isSmall ? `${map.name} (Small)` : map.name,
          src: map.src,
          gameMode: map.gameMode,
          isSmall: isSmall,
        });

        processedVariants.add(variantId);
      });

      const response = await fetch(`/api/admin/queues/${queue._id}/map-pool`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mapPool: mapPoolItems.length > 0 ? mapPoolItems : null,
        }),
      });

      let saveBody: { error?: string; message?: string } = {};
      try {
        saveBody = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        safeLog.error("Save map pool failed:", response.status, saveBody);
        const { title, description } = adminMapPoolErrorToast(
          response.status,
          typeof saveBody.error === "string"
            ? saveBody.error
            : typeof saveBody.message === "string"
              ? saveBody.message
              : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      // Refetch queue to update state
      const queueResponse = await fetch("/api/queues");
      if (queueResponse.ok) {
        const queuesData = await queueResponse.json();
        setQueues(queuesData);
      }

      const tierNote = queue.eloTier?.trim()
        ? ` (${queue.eloTier})`
        : "";
      toast({
        title: "Map pool saved",
        description: `Updated maps for ${queue.gameType}${tierNote}.`,
      });

      setMapsDialogOpen((prev) => ({
        ...prev,
        [queue._id]: false,
      }));
      setManagingMapsQueue(null);
    } catch (error: unknown) {
      safeLog.error("Error saving map pool:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSaving((prev) => ({ ...prev, [queue._id]: false }));
    }
  };

  // First, update the handleDeleteQueue function to include more information
  const handleDeleteQueue = async (
    queueId: string,
    queueName: string,
    eloTier: string,
    teamSize: number,
  ) => {
    setQueueToDelete({ queueId, name: queueName, eloTier, teamSize });
  };

  // Then update the dialog description
  const confirmDeleteQueue = async () => {
    if (!queueToDelete || !session?.user) return;

    setJoiningQueue(queueToDelete.queueId);

    try {
      const response = await fetch(`/api/queues/${queueToDelete.queueId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON */
      }

      if (!response.ok) {
        safeLog.error("Delete queue failed:", response.status, data);
        const { title, description } = adminDeleteQueueErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({
          title,
          description,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      toast({
        title: "Queue deleted",
        description: `"${queueToDelete.name}" was removed.`,
        duration: 3000,
      });
    } catch (error) {
      safeLog.error("Delete queue:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({
        title,
        description,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setJoiningQueue(null);
      setQueueToDelete(null);
    }
  };

  // Function to handle tab changes and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash without full page reload
    window.history.pushState(null, "", `#${value}`);
  };

  // Effect to sync with URL hash on load and hash changes
  useEffect(() => {
    // First check for query parameter
    const params = new URLSearchParams(window.location.search);
    const teamSizeParam = params.get("teamSize");

    if (teamSizeParam) {
      safeLog.log(
        "Setting active tab to:",
        `${teamSizeParam}v${teamSizeParam}`,
      );
      setActiveTab(`${teamSizeParam}v${teamSizeParam}`);
      return;
    }

    // Then check for hash
    const hashTab = window.location.hash.replace("#", "");

    if (hashTab && ["1v1", "2v2", "4v4", "5v5", "8v8"].includes(hashTab)) {
      setActiveTab(hashTab);
    }
  }, []);

  if (!session) {
    return (
      <div className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-muted-foreground">
            Please sign in to view queues
          </p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="queues">
      <div className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header: stack on small screens so Create sits under title/description */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/40">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Ranked Matchmaking
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Join queues and compete in ranked matches
            </p>
          </div>
          {isAdmin() && (
            <div className="w-full sm:w-auto flex sm:justify-end">
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    form.reset(DEFAULT_CREATE_QUEUE_VALUES);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0 w-full sm:w-auto"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Create Queue</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Create Queue</DialogTitle>
                  <DialogDescription>
                    Configure a new ranked matchmaking queue
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5 mt-2"
                  >
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1v1</SelectItem>
                              <SelectItem value="2">2v2</SelectItem>
                              <SelectItem value="4">4v4</SelectItem>
                              <SelectItem value="5">5v5</SelectItem>
                              <SelectItem value="8">8v8</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eloTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ELO tier (optional)</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (
                                value === "low" ||
                                value === "mid" ||
                                value === "high"
                              ) {
                                const preset = ELO_TIER_PRESETS[value];
                                form.setValue("minElo", preset.minElo);
                                form.setValue("maxElo", preset.maxElo);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tier tag" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={CREATE_QUEUE_TIER_NONE}>
                                None
                              </SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="mid">Mid</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tier tag for pre-set min/max ELOs.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minElo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min ELO</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maxElo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max ELO</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingQueue}>
                        {isCreatingQueue ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Queue
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Registration banner */}
        {!isRegistered && !isCheckingRegistration && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-amber-500/20 bg-amber-500/5 mb-6">
            <div>
              <p className="text-sm font-medium">
                Register for Ranked Matchmaking
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Required before joining any queue
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleRegisterForRanked}
              disabled={isRegistering}
              className="shrink-0"
            >
              {isRegistering ? "Registering..." : "Register"}
            </Button>
          </div>
        )}

        {/* Missing team sizes banner */}
        {isRegistered && missingTeamSizes.length > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 mb-6">
            <div>
              <p className="text-sm font-medium">
                Additional Registration Needed
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add {missingTeamSizes.map((s) => `${s}v${s}`).join(", ")} to your
                profile. ELO copies from your 4v4 ladder when you have it,
                otherwise 800.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleRegisterMissingTeamSizes}
              disabled={isRegisteringMissing}
              className="shrink-0"
            >
              {isRegisteringMissing ? "Registering..." : "Register"}
            </Button>
          </div>
        )}

        {/* Mobile: dropdown selector + stacked cards */}
        {isMobile ? (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between w-full mb-4"
                >
                  {activeTab.toUpperCase()} Queues
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {["1v1", "2v2", "4v4", "5v5", "8v8"].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => setActiveTab(size)}
                  >
                    {size} Queues
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="space-y-4">
              {Array.isArray(queues) &&
                queues
                  .filter((q) => q?.teamSize === parseInt(activeTab.charAt(0)))
                  .map((queue) => {
                    const { activePlayers, waitlistPlayers } =
                      getQueueSections(queue);
                    return (
                      <QueueCard
                        key={queue._id}
                        queue={queue}
                        activePlayers={activePlayers}
                        waitlistPlayers={waitlistPlayers}
                        isPlayerInQueue={isPlayerInQueue(queue)}
                        canLaunch={canLaunchMatch(queue)}
                        hasRequired={hasRequiredPlayers(queue)}
                        joiningQueue={joiningQueue}
                        leavingQueue={leavingQueue}
                        pendingOperations={pendingOperations}
                        formatJoinTime={formatJoinTime}
                        onJoin={() => handleJoinQueue(queue._id)}
                        onLeave={() => handleLeaveQueue(queue._id)}
                        onLaunch={() => handleLaunchMatch(queue._id)}
                        onFill={() => handleFillQueue(queue._id, true)}
                        onClear={() => handleClearQueue(queue._id)}
                        onCopyId={() => copyToClipboard(queue.queueId)}
                        onRemovePlayer={(pid, name) =>
                          handleRemovePlayer(queue._id, pid, name)
                        }
                        onManageMaps={() => {
                          setManagingMapsQueue(queue);
                          setMapsDialogOpen((prev) => ({
                            ...prev,
                            [queue._id]: true,
                          }));
                        }}
                        onDelete={() =>
                          handleDeleteQueue(
                            queue._id,
                            queue.gameType ?? "Queue",
                            queue.eloTier ?? "any",
                            queue.teamSize,
                          )
                        }
                        showAdmin={isAdmin()}
                        showDeveloperAdmin={isDeveloperOrAdmin()}
                        showManageMaps={canManageMaps()}
                        showManageQueueBans={canManageQueueBans()}
                        onManageQueueBans={
                          canManageQueueBans()
                            ? () =>
                                void openBannedPlayersDialogForQueue(
                                  queue as AdminQueueRecord,
                                )
                            : undefined
                        }
                      />
                    );
                  })}
            </div>
          </div>
        ) : (
          /* Desktop: underline tabs + card grid */
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="flex h-auto p-0 bg-transparent rounded-none border-b border-border/40 w-full justify-start gap-0 mb-6">
              {["1v1", "2v2", "4v4", "5v5", "8v8"].map((size) => (
                <TabsTrigger
                  key={size}
                  value={size}
                  onClick={() => handleTabChange(size)}
                  className="rounded-none bg-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary -mb-px transition-colors"
                >
                  {size}
                </TabsTrigger>
              ))}
            </TabsList>

            {["1v1", "2v2", "4v4", "5v5", "8v8"].map((size) => (
              <TabsContent key={size} value={size} className="mt-0">
                {Array.isArray(queues) ? (
                  queues.filter((q) => q?.teamSize === parseInt(size.charAt(0)))
                    .length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {queues
                        .filter((q) => q?.teamSize === parseInt(size.charAt(0)))
                        .map((queue) => {
                          const { activePlayers, waitlistPlayers } =
                            getQueueSections(queue);
                          return (
                            <QueueCard
                              key={queue._id}
                              queue={queue}
                              activePlayers={activePlayers}
                              waitlistPlayers={waitlistPlayers}
                              isPlayerInQueue={isPlayerInQueue(queue)}
                              canLaunch={canLaunchMatch(queue)}
                              hasRequired={hasRequiredPlayers(queue)}
                              joiningQueue={joiningQueue}
                              leavingQueue={leavingQueue}
                              pendingOperations={pendingOperations}
                              formatJoinTime={formatJoinTime}
                              onJoin={() => handleJoinQueue(queue._id)}
                              onLeave={() => handleLeaveQueue(queue._id)}
                              onLaunch={() => handleLaunchMatch(queue._id)}
                              onFill={() => handleFillQueue(queue._id, true)}
                              onClear={() => handleClearQueue(queue._id)}
                              onCopyId={() => copyToClipboard(queue.queueId)}
                              onRemovePlayer={(pid, name) =>
                                handleRemovePlayer(queue._id, pid, name)
                              }
                              onManageMaps={() => {
                                setManagingMapsQueue(queue);
                                setMapsDialogOpen((prev) => ({
                                  ...prev,
                                  [queue._id]: true,
                                }));
                              }}
                              onDelete={() =>
                                handleDeleteQueue(
                                  queue._id,
                                  queue.gameType ?? "Queue",
                                  queue.eloTier ?? "any",
                                  queue.teamSize,
                                )
                              }
                              showAdmin={isAdmin()}
                              showDeveloperAdmin={isDeveloperOrAdmin()}
                              showManageMaps={canManageMaps()}
                              showManageQueueBans={canManageQueueBans()}
                              onManageQueueBans={
                                canManageQueueBans()
                                  ? () =>
                                      void openBannedPlayersDialogForQueue(
                                        queue as AdminQueueRecord,
                                      )
                                  : undefined
                              }
                            />
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-muted-foreground">
                        No {size} queues available
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="mt-10 rounded-xl border border-border/50 bg-muted/15 px-4 py-4 sm:mt-12 sm:px-5 sm:py-5">
          <p className="text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
            <Link
              href="/moderation-log"
              className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Public moderation log
            </Link>
            <span className="text-muted-foreground">
              {" "}
              — view warnings, bans, and queue removals for community
              transparency.
            </span>
          </p>
        </div>
      </div>

      {/* Remove Player confirmation */}
      {playerToRemove && (
        <AlertDialog
          open={!!playerToRemove}
          onOpenChange={() => setPlayerToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Player</AlertDialogTitle>
              <AlertDialogDescription>
                Remove {playerToRemove.playerName} from the queue? This cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemovePlayer}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Queue confirmation */}
      {queueToDelete && (
        <AlertDialog
          open={!!queueToDelete}
          onOpenChange={() => setQueueToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Queue</AlertDialogTitle>
              <AlertDialogDescription>
                Delete{" "}
                {queueToDelete.name ? `“${queueToDelete.name}”` : "this queue"}
                {queueToDelete.teamSize != null
                  ? ` (${queueToDelete.teamSize}v${queueToDelete.teamSize})`
                  : ""}
                {queueToDelete.eloTier?.trim()
                  ? ` — tier tag: ${queueToDelete.eloTier}`
                  : ""}
                ? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteQueue}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AdminQueueMapPoolDialog
        open={
          managingMapsQueue && managingMapsQueue._id
            ? mapsDialogOpen[managingMapsQueue._id] || false
            : false
        }
        onOpenChange={handleMapPoolDialogOpenChange}
        queue={managingMapsQueue as AdminQueueRecord | null}
        filteredMaps={mapPoolDialogFilteredMaps}
        mapPoolSearch={mapPoolSearch}
        setMapPoolSearch={setMapPoolSearch}
        selectedMapIds={
          managingMapsQueue && managingMapsQueue._id
            ? selectedMaps[managingMapsQueue._id] || []
            : []
        }
        totalMapCount={maps.length}
        onToggleMap={(mapId) =>
          managingMapsQueue &&
          toggleMapSelection(managingMapsQueue._id, mapId)
        }
        onSelectAllMaps={() =>
          managingMapsQueue &&
          managingMapsQueue._id &&
          selectAllMaps(managingMapsQueue._id)
        }
        onDeselectAllMaps={() =>
          managingMapsQueue &&
          managingMapsQueue._id &&
          deselectAllMaps(managingMapsQueue._id)
        }
        saving={Boolean(
          managingMapsQueue &&
            managingMapsQueue._id &&
            saving[managingMapsQueue._id],
        )}
        onSave={async () => {
          if (!managingMapsQueue || saving[managingMapsQueue._id]) return;
          try {
            await handleSaveMaps(managingMapsQueue);
          } catch {
            /* handled in handleSaveMaps */
          }
        }}
      />
      <AdminQueueBansDialog
        open={
          managingBannedPlayersQueue && managingBannedPlayersQueue._id
            ? bannedPlayersDialogOpen[managingBannedPlayersQueue._id] || false
            : false
        }
        onOpenChange={handleBansDialogOpenChange}
        queue={managingBannedPlayersQueue}
        playerSearch={playerSearch}
        onPlayerSearchChange={handleBannedPlayerSearchChange}
        searchResults={searchResults}
        bannedPlayers={bannedPlayers}
        setBannedPlayers={setBannedPlayers}
        bannedPlayersInfo={bannedPlayersInfo}
        setBannedPlayersInfo={setBannedPlayersInfo}
        savingBannedPlayers={savingBannedPlayers}
        onSave={saveBannedPlayersList}
      />
    </FeatureGate>
  );
}
