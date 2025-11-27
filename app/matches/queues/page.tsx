"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { FeatureGate } from "@/components/feature-gate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import {
  PlusCircle,
  Copy,
  UserMinus,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Bell,
  Users,
  AlertCircle,
  Trophy,
  Target,
  MapPin,
  Loader2,
  Save,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import io from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DialogDescription } from "@/components/ui/dialog";

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
  gameType: "ranked";
  teamSize: number;
  players: QueuePlayer[];
  eloTier: "low" | "mid" | "high";
  minElo: number;
  maxElo: number;
  status: "active" | "inactive";
}

// Create queue form schema
const createQueueSchema = z.object({
  teamSize: z.enum(["1", "2", "4", "5"]),
  eloTier: z.enum(["low", "mid", "high"]),
  minElo: z.coerce.number().min(0).max(5000),
  maxElo: z.coerce.number().min(0).max(5000),
});

export default function QueuesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [queues, setQueues] = useState<Array<any>>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);
  const [leavingQueue, setLeavingQueue] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  const [lastActionTime, setLastActionTime] = useState<Record<string, number>>({});
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
  const [has4v4, setHas4v4] = useState<boolean>(false);
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
  const [selectedMaps, setSelectedMaps] = useState<Record<string, string[]>>({});
  const [managingMapsQueue, setManagingMapsQueue] = useState<any | null>(null);
  const [mapsDialogOpen, setMapsDialogOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Create queue form
  const form = useForm<z.infer<typeof createQueueSchema>>({
    resolver: zodResolver(createQueueSchema),
    defaultValues: {
      teamSize: "4",
      eloTier: "mid",
      minElo: 1000,
      maxElo: 2000,
    },
  });

  // Check if user is admin
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/discord/user-roles");
          if (response.ok) {
            const data = await response.json();
            setUserRoles(data.roles || []);
          }
        } catch (error) {
          // Silently handle errors
        }
      }
    };
    fetchRoles();
  }, [session?.user?.id]);

  const isAdmin = useCallback(() => {
    if (!session?.user?.id) return false;

    const isDeveloper =
      session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session.user.id === "238329746671271936";

    const roles = userRoles.length > 0 ? userRoles : session?.user?.roles || [];
    const hasAdminRoleCheck = hasAdminRole(roles);
    const isAdminUser = session.user.isAdmin;

    return isDeveloper || isAdminUser || hasAdminRoleCheck;
  }, [session?.user?.id, session?.user?.isAdmin, session?.user?.roles, userRoles]);

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

    // Initial fetch
    const fetchQueues = async () => {
      try {
        const response = await fetch("/api/queues");
        if (!response.ok) throw new Error("Failed to fetch queues");
        const data = await response.json();
        setQueues(data);
      } catch (error) {
        console.error("Error fetching queues:", error);
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
              src: `/maps/map_${map.name.toLowerCase().replace(/\s+/g, "")}.png`,
            });
          }
        }
        setMaps(mapsWithVariants);
      } catch (error) {
        console.error("Error fetching maps:", error);
      }
    };

    // Check if user can manage maps
    const roles = userRoles.length > 0 ? userRoles : session?.user?.roles || [];
    const isDeveloper = session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID || session?.user?.id === "238329746671271936";
    const hasModeratorRole = roles.includes(SECURITY_CONFIG.ROLES.MODERATOR);
    const hasAdminRole = roles.includes(SECURITY_CONFIG.ROLES.ADMIN);
    const hasFounderRole = roles.includes(SECURITY_CONFIG.ROLES.FOUNDER);
    const canManage = isDeveloper || isAdmin() || hasModeratorRole || hasAdminRole || hasFounderRole || session?.user?.isAdmin;

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
    const pollingIntervalMs = 10000; // Poll every 10 seconds as fallback
    const heartbeatTimeoutMs = 30000; // If no heartbeat for 30s, assume SSE is dead

    // Polling function - fetches queues via regular API
    const pollQueues = async () => {
      // Only poll if page is visible (save resources when tab is in background)
      if (document.hidden) return;
      
      try {
        const response = await fetch("/api/queues");
        if (!response.ok) throw new Error("Failed to fetch queues");
        const data = await response.json();
        setQueues(data);
      } catch (error) {
        console.error("Error polling queues:", error);
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
        if (timeSinceLastHeartbeat > heartbeatTimeoutMs && isSSEConnected && !isPollingActive) {
          console.log("SSE appears dead (no heartbeat), starting polling fallback");
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
              console.error("SSE server error:", data.message);
              return;
            }

            // Update queues if we received an array
            if (Array.isArray(data)) {
              setQueues(data);
            }
          } catch (error) {
            console.error("Error parsing SSE data:", error);
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
              30000 // Max 30 seconds
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
        console.error("Error creating SSE connection:", error);
        // Retry connection, but start polling if this keeps failing
        if (reconnectAttempts >= 2 && !isPollingActive) {
          startPolling();
        }
        
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttempts),
            30000
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
      (p: QueuePlayer) => p.discordId === session.user.id
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
          : q
      )
    );

    try {
      const response = await fetch(`/api/queues/${queueId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join queue");
      }

      // Success - SSE will update with correct data, but optimistic update already shown
      toast({
        title: "Success",
        description: "Successfully joined queue",
        duration: 2000,
      });
    } catch (error) {
      // Revert optimistic update on error
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q._id === queueId
            ? {
                ...q,
                players: (q.players || []).filter(
                  (p: QueuePlayer) => p.discordId !== session.user.id
                ),
              }
            : q
        )
      );

      console.error("Error joining queue:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to join queue",
        variant: "destructive",
        duration: 2000,
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
      (p: QueuePlayer) => p.discordId === session.user.id
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
                (p: QueuePlayer) => p.discordId !== session.user.id
              ),
            }
          : q
      )
    );

    try {
      const response = await fetch(`/api/queues/${queueId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to leave queue");
      }

      // Success - SSE will update with correct data, but optimistic update already shown
      toast({
        title: "Success",
        description: "Successfully left queue",
        duration: 2000,
      });
    } catch (error) {
      // Revert optimistic update on error
      setQueues(previousQueues);

      console.error("Error leaving queue:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to leave queue",
        variant: "destructive",
        duration: 2000,
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
    console.log("Launch match attempt:", {
      sessionData: session,
      userId: session?.user?.id,
    });
    try {
      const response = await fetch(`/api/queues/${queueId}/launch`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to launch match");
      }

      const data = await response.json();

      // Redirect to the match detail page
      if (data.matchId) {
        router.push(`/matches/${data.matchId}`);
      }

      toast({
        title: "Match Launched",
        description: "The match has been created successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to launch match",
        variant: "destructive",
        duration: 3000,
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fill queue");
      }

      toast({
        title: "Queue Filled",
        description: "The queue has been filled with random players",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fill queue",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  // Add this function after handleFillQueue
  const handleClearQueue = async (queueId: string) => {
    console.log("Clear queue attempt:", {
      sessionData: session,
      userId: session?.user?.id,
    });
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const response = await fetch(`/api/queues/${queueId}/clear`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear queue");
      }

      toast({
        title: "Queue Cleared",
        description: "All players have been removed from the queue",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to clear queue",
        variant: "destructive",
        duration: 2000,
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
      console.error("Error formatting date:", error);
      return "just now";
    }
  };

  // Update the getQueueSections helper to be more dynamic
  const getQueueSections = (queue: Queue) => {
    const requiredPlayers = queue.teamSize * 2;

    // Sort players by join time (first come, first served)
    const sortedPlayers = [...queue.players].sort(
      (a, b) => a.joinedAt - b.joinedAt
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
    return hasRequiredRole && hasEnoughPlayers;
  };

  // Handle create queue form submission
  const onSubmit = async (values: z.infer<typeof createQueueSchema>) => {
    if (!session?.user) return;

    setIsCreatingQueue(true);

    try {
      const response = await fetch("/api/queues/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamSize: parseInt(values.teamSize),
          eloTier: values.eloTier,
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
      form.reset();
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
    playerName: string
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
        }
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

  // Wrap checkUserRegistration with useCallback
  const checkUserRegistration = useCallback(async () => {
    if (!session?.user) return;

    setIsCheckingRegistration(true);
    try {
      const response = await fetch(`/api/players/check-registration`);
      const data = await response.json();
      setIsRegistered(data.isRegistered);
    } catch (error) {
      console.error("Failed to check registration:", error);
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [session?.user]);

  // Now the useEffect will work correctly
  useEffect(() => {
    if (session?.user) {
      checkUserRegistration();
    }
  }, [session, checkUserRegistration]);

  // Add this function to check for missing team sizes
  const checkMissingTeamSizes = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/players/check-missing-teamsizes`);
      const data = await response.json();

      setMissingTeamSizes(data.missingTeamSizes || []);
      setHas4v4(data.has4v4 || false);
    } catch (error) {
      console.error("Failed to check missing team sizes:", error);
    }
  }, [session?.user]);

  // Update the useEffect that calls checkUserRegistration to also call checkMissingTeamSizes
  useEffect(() => {
    if (session?.user) {
      checkUserRegistration();
      checkMissingTeamSizes();
    }
  }, [session, checkUserRegistration, checkMissingTeamSizes]);

  // Add function to handle registering missing team sizes
  const handleRegisterMissingTeamSizes = async () => {
    if (!session?.user) return;

    setIsRegisteringMissing(true);
    try {
      const response = await fetch(`/api/players/register-missing-teamsizes`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "Failed to register for missing team sizes"
        );
      }

      const data = await response.json();
      setMissingTeamSizes([]);

      toast({
        title: "Registration Successful",
        description: `You have been registered for ${data.registeredSizes
          .map((size: number) => `${size}v${size}`)
          .join(", ")} queues`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to register for missing team sizes",
        variant: "destructive",
        duration: 3000,
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to register for ranked");
      }

      setIsRegistered(true);
      toast({
        title: "Registration Successful",
        description: "You have been registered for ranked matchmaking",
        duration: 3000,
      });

      // After registering, check for missing team sizes
      checkMissingTeamSizes();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to register for ranked",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Check if user is developer (you) or admin
  const isDeveloperOrAdmin = () => {
    return (
      isAdmin() ||
      (session?.user?.id && session.user.id === SECURITY_CONFIG.DEVELOPER_ID)
    );
  };

  // Check if user can manage maps (developer, admin, moderator, or founder)
  const canManageMaps = () => {
    if (!session?.user) return false;
    const roles = userRoles || session.user.roles || [];
    const isDeveloper = session.user.id === SECURITY_CONFIG.DEVELOPER_ID || session.user.id === "238329746671271936";
    const hasModeratorRole = roles.includes(SECURITY_CONFIG.ROLES.MODERATOR);
    const hasAdminRole = roles.includes(SECURITY_CONFIG.ROLES.ADMIN);
    const hasFounderRole = roles.includes(SECURITY_CONFIG.ROLES.FOUNDER);
    
    return (
      isDeveloper ||
      isAdmin() ||
      hasModeratorRole ||
      hasAdminRole ||
      hasFounderRole ||
      session.user.isAdmin
    );
  };

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
          const response = await fetch(`/api/admin/queues/${managingMapsQueue._id}/map-pool`);
          if (response.ok) {
            const queueData = await response.json();
            const currentQueue = { ...managingMapsQueue, mapPool: queueData.mapPool };
            
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
            } else if (!currentQueue.mapPool || currentQueue.mapPool.length === 0) {
              // If no map pool, initialize with empty selection (not all maps)
              setSelectedMaps((prev) => ({
                ...prev,
                [managingMapsQueue._id]: [],
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching queue map pool:", error);
          // Fallback to using the queue object's mapPool if available
          if (managingMapsQueue.mapPool && Array.isArray(managingMapsQueue.mapPool)) {
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
        throw new Error("Please select at least one map");
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to save");
      }

      // Refetch queue to update state
      const queueResponse = await fetch("/api/queues");
      if (queueResponse.ok) {
        const queuesData = await queueResponse.json();
        setQueues(queuesData);
      }

      toast({
        title: "Success",
        description: `Map pool updated for ${queue.gameType} ${queue.eloTier}`,
      });

      setMapsDialogOpen((prev) => ({
        ...prev,
        [queue._id]: false,
      }));
      setManagingMapsQueue(null);
    } catch (error: any) {
      console.error("Error saving map pool:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save map pool",
        variant: "destructive",
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
    teamSize: number
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete queue");
      }

      toast({
        title: "Queue Deleted",
        description: `Queue "${queueToDelete.name}" has been deleted`,
        duration: 3000,
      });

      // The socket connection will automatically update the queues
      // No need to manually refresh as the server will emit an update
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete queue",
        variant: "destructive",
        duration: 3000,
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
      console.log(
        "Setting active tab to:",
        `${teamSizeParam}v${teamSizeParam}`
      );
      setActiveTab(`${teamSizeParam}v${teamSizeParam}`);
      return;
    }

    // Then check for hash
    const hashTab = window.location.hash.replace("#", "");

    if (hashTab && ["1v1", "2v2", "4v4", "5v5"].includes(hashTab)) {
      setActiveTab(hashTab);
    }
  }, []);

  if (!session) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please sign in to view queues</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FeatureGate feature="queues">
      <div className="container px-4 py-6 mx-auto max-w-screen-2xl sm:px-6 lg:px-8 sm:py-8 lg:py-10">
        <div className="flex flex-row justify-between items-center pb-4 mb-6 border-b sm:pb-6 sm:mb-8 border-border/40">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-gradient-to-br rounded-lg border from-primary/20 to-primary/10 border-primary/20">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r sm:text-2xl from-foreground to-foreground/70">
                Ranked Matchmaking
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Join queues and compete in ranked matches
              </p>
            </div>
          </div>
          {isAdmin() && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex gap-2 items-center shadow-md transition-shadow hover:shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Queue</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-0 border-2 shadow-2xl">
                <div className="overflow-hidden relative">
                  {/* Gradient Header Background */}
                  <div className="absolute inset-0 bg-gradient-to-br to-transparent opacity-50 pointer-events-none from-primary/20 via-primary/10" />

                  <DialogHeader className="relative p-6 pb-5 space-y-3 bg-gradient-to-r to-transparent border-b border-border/40 from-primary/5 via-primary/5">
                    <div className="flex gap-3 items-center">
                      <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br to-transparent rounded-xl opacity-50 from-primary/40" />
                        <PlusCircle className="relative w-5 h-5 drop-shadow-sm text-primary" />
                      </div>
                      <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                        Create New Queue
                      </DialogTitle>
                    </div>
                    <p className="pl-11 text-sm text-muted-foreground">
                      Configure a new ranked matchmaking queue
                    </p>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="p-6 space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="teamSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2.5 text-sm font-semibold mb-2.5">
                              <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              Team Size
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 border-2 shadow-sm transition-colors bg-background hover:border-primary/50">
                                  <SelectValue placeholder="Select team size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1v1</SelectItem>
                                <SelectItem value="2">2v2</SelectItem>
                                <SelectItem value="4">4v4</SelectItem>
                                <SelectItem value="5">5v5</SelectItem>
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
                            <FormLabel className="flex items-center gap-2.5 text-sm font-semibold mb-2.5">
                              <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                                <Trophy className="w-4 h-4 text-primary" />
                              </div>
                              ELO Tier
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 border-2 shadow-sm transition-colors bg-background hover:border-primary/50">
                                  <SelectValue placeholder="Select ELO tier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="mid">Mid</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="minElo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold mb-2.5">
                                Min ELO
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  className="h-11 border-2 shadow-sm transition-colors bg-background hover:border-primary/50 focus:border-primary"
                                />
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
                              <FormLabel className="text-sm font-semibold mb-2.5">
                                Max ELO
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  className="h-11 border-2 shadow-sm transition-colors bg-background hover:border-primary/50 focus:border-primary"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter className="flex-col-reverse gap-3 pt-6 border-t border-border/40 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="w-full h-11 border-2 shadow-sm transition-all sm:w-auto hover:shadow-md"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreatingQueue}
                          className="w-full h-11 font-semibold bg-gradient-to-r shadow-lg transition-all sm:w-auto from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:shadow-xl"
                        >
                          {isCreatingQueue ? (
                            <>
                              <span className="mr-2">Creating...</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="mr-2 w-4 h-4" />
                              Create Queue
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div>
          {!isRegistered && !isCheckingRegistration && (
            <div className="mb-6">
              <Card className="bg-gradient-to-br border-2 shadow-md border-primary/20 from-primary/5 to-primary/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 justify-center items-center text-center">
                    <div className="p-3 rounded-full border bg-primary/10 border-primary/20">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold sm:text-xl">
                      Register for Ranked Matchmaking
                    </h3>
                    <p className="max-w-md text-sm sm:text-base text-muted-foreground">
                      You need to register before you can join ranked queues.
                    </p>
                    <Button
                      onClick={handleRegisterForRanked}
                      disabled={isRegistering}
                      className="w-full max-w-xs shadow-md transition-shadow hover:shadow-lg"
                    >
                      {isRegistering ? "Registering..." : "Register for Ranked"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {isRegistered && missingTeamSizes.length > 0 && has4v4 && (
            <div className="mb-6">
              <Card className="bg-gradient-to-br border-2 shadow-md border-primary/20 from-primary/5 to-primary/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 justify-center items-center text-center">
                    <div className="p-3 rounded-full border bg-primary/10 border-primary/20">
                      <Bell className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold sm:text-xl">
                      Register for Ranked
                    </h3>
                    <p className="max-w-md text-sm sm:text-base text-muted-foreground">
                      You&apos;re missing registration for some team sizes.
                      We&apos;ll copy your 4v4 ELO to these team sizes.
                    </p>
                    <Button
                      onClick={handleRegisterMissingTeamSizes}
                      disabled={isRegisteringMissing}
                      className="w-full max-w-xs shadow-md transition-shadow hover:shadow-lg"
                    >
                      {isRegisteringMissing
                        ? "Registering..."
                        : missingTeamSizes.length > 1
                        ? `Register for ${missingTeamSizes
                            .map((size) => `${size}v${size}`)
                            .join(", ")}`
                        : `Register for ${missingTeamSizes[0]}v${missingTeamSizes[0]}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {isMobile ? (
            <div className="mt-6 mb-4 sm:mt-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between w-full">
                    {activeTab === "4v4" && "4v4 Queues"}
                    {activeTab === "5v5" && "5v5 Queues"}
                    {activeTab === "2v2" && "2v2 Queues"}
                    {activeTab === "1v1" && "1v1 Queues"}
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setActiveTab("4v4")}>
                    4v4 Queues
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("5v5")}>
                    5v5 Queues
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("2v2")}>
                    2v2 Queues
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("1v1")}>
                    1v1 Queues
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="mt-4 space-y-4 sm:space-y-6">
                {queues
                  .filter((queue) => {
                    if (activeTab === "4v4") return queue.teamSize === 4;
                    if (activeTab === "5v5") return queue.teamSize === 5;
                    if (activeTab === "2v2") return queue.teamSize === 2;
                    if (activeTab === "1v1") return queue.teamSize === 1;
                    return false;
                  })
                  .map((queue) => (
                    <ContextMenu key={queue._id}>
                      <ContextMenuTrigger className="block mb-6 sm:mb-8">
                        <Card className="flex overflow-hidden flex-col border-2 shadow-md transition-all duration-200 hover:border-primary/50 hover:shadow-xl">
                          <CardHeader className="bg-gradient-to-r border-b from-muted/60 via-muted/50 to-muted/40 border-border/40">
                            <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
                              <div>
                                <CardTitle className="text-lg font-bold sm:text-xl">
                                  {queue.eloTier.charAt(0).toUpperCase() +
                                    queue.eloTier.slice(1)}{" "}
                                  Queue
                                </CardTitle>
                                <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                                  {queue.minElo} - {queue.maxElo} ELO
                                </p>
                              </div>
                              {isPlayerInQueue(queue) ? (
                                <Button
                                  variant="destructive"
                                  onClick={() => handleLeaveQueue(queue._id)}
                                  disabled={
                                    joiningQueue === queue._id ||
                                    leavingQueue === queue._id ||
                                    pendingOperations.has(queue._id)
                                  }
                                  size="sm"
                                  className="shadow-md transition-shadow hover:shadow-lg"
                                >
                                  {leavingQueue === queue._id ||
                                  pendingOperations.has(queue._id) ? (
                                    <>
                                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                      Leaving...
                                    </>
                                  ) : (
                                    "Leave"
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleJoinQueue(queue._id)}
                                  disabled={
                                    joiningQueue === queue._id ||
                                    leavingQueue === queue._id ||
                                    pendingOperations.has(queue._id)
                                  }
                                  size="sm"
                                >
                                  {joiningQueue === queue._id ||
                                  pendingOperations.has(queue._id) ? (
                                    <>
                                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                      Joining...
                                    </>
                                  ) : (
                                    "Join Queue"
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="flex flex-col flex-1 p-4 sm:p-6">
                            {/* Active Players List */}
                            <div
                              className="mb-4"
                              style={{
                                height: `${
                                  queue.teamSize * 52 +
                                  (queue.teamSize - 1) * 6 +
                                  40
                                }px`,
                              }}
                            >
                              <div className="flex gap-2 items-center mb-2">
                                <h4 className="text-sm font-medium">Players</h4>
                                <span className="text-sm text-muted-foreground">
                                  (
                                  {Math.min(
                                    queue.players.length,
                                    queue.teamSize * 2
                                  )}
                                  /{queue.teamSize * 2})
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {getQueueSections(queue).activePlayers.length >
                                0 ? (
                                  getQueueSections(queue).activePlayers.map(
                                    (player, index) => (
                                      <div
                                        key={player.discordId}
                                        className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-muted/40 to-muted/30 border border-border/30 hover:border-primary/30 hover:shadow-sm transition-all duration-200 h-[52px]"
                                      >
                                        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                                          <div className="flex gap-1.5 items-center min-w-0">
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded shrink-0">
                                              #{index + 1}
                                            </span>
                                            <span className="text-xs font-medium break-words line-clamp-1">
                                              {player.discordNickname}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-muted-foreground">
                                            {formatJoinTime(player.joinedAt)}
                                          </span>
                                        </div>
                                        <span className="px-1.5 py-0.5 ml-2 text-xs font-semibold rounded text-foreground shrink-0 bg-primary/10">
                                          {player.elo}
                                        </span>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <div className="col-span-2 py-8 text-center">
                                    <Users className="mx-auto mb-2 w-8 h-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">
                                      No players in queue
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Waitlist Section */}
                            <div
                              className="flex flex-col pt-1.5 mb-1.5 border-t"
                              style={{ height: "100px" }}
                            >
                              <div className="flex justify-between items-center mb-0.5">
                                <div className="flex gap-2 items-center">
                                  <h4 className="text-xs font-medium">
                                    Waitlist
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    (
                                    {
                                      getQueueSections(queue).waitlistPlayers
                                        .length
                                    }
                                    )
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col">
                                {getQueueSections(queue).waitlistPlayers
                                  .length > 0 ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {getQueueSections(queue)
                                        .waitlistPlayers.slice(0, 2)
                                        .map((player, index) => (
                                          <div
                                            key={player.discordId}
                                            className="flex items-center justify-between p-1 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/20 hover:border-border/40 hover:shadow-sm transition-all duration-200 h-[44px]"
                                          >
                                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                                              <div className="flex gap-1 items-center min-w-0">
                                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted/50 px-1 py-0.5 rounded shrink-0">
                                                  #
                                                  {getQueueSections(queue)
                                                    .activePlayers.length +
                                                    index +
                                                    1}
                                                </span>
                                                <span className="text-xs font-medium break-words line-clamp-1">
                                                  {player.discordNickname}
                                                </span>
                                              </div>
                                              <span className="text-[10px] text-muted-foreground">
                                                {formatJoinTime(
                                                  player.joinedAt
                                                )}
                                              </span>
                                            </div>
                                            <span className="px-1.5 py-0.5 ml-2 text-xs font-semibold rounded text-muted-foreground shrink-0 bg-muted/30">
                                              {player.elo}
                                            </span>
                                          </div>
                                        ))}
                                    </div>

                                    {getQueueSections(queue).waitlistPlayers
                                      .length > 2 && (
                                      <Sheet>
                                        <SheetTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-0.5 w-full h-6 text-xs text-muted-foreground hover:text-foreground"
                                          >
                                            View{" "}
                                            {getQueueSections(queue)
                                              .waitlistPlayers.length - 2}{" "}
                                            more
                                            <ChevronDown className="ml-1 w-3 h-3" />
                                          </Button>
                                        </SheetTrigger>
                                        <SheetContent
                                          side="bottom"
                                          className="h-[80vh]"
                                        >
                                          <SheetHeader>
                                            <SheetTitle>Waitlist</SheetTitle>
                                            <SheetDescription>
                                              Players waiting to join the queue
                                            </SheetDescription>
                                          </SheetHeader>
                                          <div className="mt-4 grid gap-2 overflow-y-auto max-h-[calc(80vh-120px)]">
                                            {getQueueSections(
                                              queue
                                            ).waitlistPlayers.map(
                                              (player, index) => (
                                                <div
                                                  key={player.discordId}
                                                  className="flex justify-between items-center p-3 rounded-lg bg-muted/20"
                                                >
                                                  <div className="flex flex-col">
                                                    <div className="flex items-center">
                                                      <span className="mr-2 text-sm font-medium text-muted-foreground">
                                                        #
                                                        {getQueueSections(queue)
                                                          .activePlayers
                                                          .length +
                                                          index +
                                                          1}
                                                      </span>
                                                      <span className="text-base">
                                                        {player.discordNickname}
                                                      </span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                      {formatJoinTime(
                                                        player.joinedAt
                                                      )}
                                                    </span>
                                                  </div>
                                                  <span className="ml-2 text-base text-muted-foreground">
                                                    {player.elo}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </SheetContent>
                                      </Sheet>
                                    )}
                                  </>
                                ) : (
                                  <div className="py-1 text-center">
                                    <Users className="mx-auto mb-0.5 w-4 h-4 text-muted-foreground/50" />
                                    <p className="text-xs text-muted-foreground">
                                      No players in waitlist
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Launch and Fill Buttons */}
                            <div className="pt-4 mt-auto border-t">
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleLaunchMatch(queue._id)}
                                  disabled={
                                    !canLaunchMatch(queue) ||
                                    joiningQueue === queue._id
                                  }
                                  className="w-full"
                                >
                                  {!hasRequiredPlayers(queue)
                                    ? `Waiting for ${
                                        queue.teamSize * 2 -
                                        queue.players.length
                                      } more players`
                                    : "Launch Match"}
                                </Button>

                                {/* Admin Buttons */}
                                {isAdmin() && (
                                  <div className="flex flex-col gap-2 mt-2">
                                    <Button
                                      variant="secondary"
                                      onClick={() =>
                                        handleFillQueue(queue._id, true)
                                      }
                                      disabled={
                                    joiningQueue === queue._id ||
                                    leavingQueue === queue._id ||
                                    pendingOperations.has(queue._id)
                                  }
                                      className="w-full"
                                    >
                                      Fill Queue
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() =>
                                        handleClearQueue(queue._id)
                                      }
                                      disabled={
                                        joiningQueue === queue._id ||
                                        queue.players.length === 0
                                      }
                                      className="w-full"
                                    >
                                      Clear Queue
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-64">
                        <ContextMenuItem
                          onClick={() => copyToClipboard(queue.queueId)}
                        >
                          <Copy className="mr-2 w-4 h-4" />
                          Copy Queue ID
                        </ContextMenuItem>

                        {isDeveloperOrAdmin() && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuSub>
                              <ContextMenuSubTrigger>
                                <UserMinus className="mr-2 w-4 h-4" />
                                Remove Player
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent className="w-48">
                                {queue.players.length > 0 ? (
                                  queue.players.map(
                                    (player: QueuePlayer, index: number) => (
                                      <ContextMenuItem
                                        key={player.discordId}
                                        onClick={() =>
                                          handleRemovePlayer(
                                            queue._id,
                                            player.discordId,
                                            player.discordNickname
                                          )
                                        }
                                      >
                                        <span className="mr-2 text-xs font-medium text-muted-foreground">
                                          #{index + 1}
                                        </span>
                                        {player.discordNickname}
                                      </ContextMenuItem>
                                    )
                                  )
                                ) : (
                                  <ContextMenuItem disabled>
                                    No players in queue
                                  </ContextMenuItem>
                                )}
                              </ContextMenuSubContent>
                            </ContextMenuSub>

                            <ContextMenuSeparator />
                            {/* Simple Delete Queue option at the bottom with destructive style */}
                            <ContextMenuItem
                              onClick={() =>
                                handleDeleteQueue(
                                  queue._id,
                                  queue.name,
                                  queue.eloTier || "any", // Add eloTier
                                  queue.teamSize // Add teamSize
                                )
                              }
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            >
                              <Trash2 className="mr-2 w-4 h-4" />
                              Delete Queue
                            </ContextMenuItem>
                          </>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
              </div>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="mt-6 w-full sm:mt-8"
            >
              <TabsList className="grid grid-cols-4 p-1 mb-6 w-full h-auto border-2 sm:mb-8 bg-muted/50">
                <TabsTrigger
                  value="1v1"
                  onClick={() => handleTabChange("1v1")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-semibold"
                >
                  1v1
                </TabsTrigger>
                <TabsTrigger
                  value="2v2"
                  onClick={() => handleTabChange("2v2")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-semibold"
                >
                  2v2
                </TabsTrigger>

                <TabsTrigger
                  value="4v4"
                  onClick={() => handleTabChange("4v4")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-semibold"
                >
                  4v4
                </TabsTrigger>
                <TabsTrigger
                  value="5v5"
                  onClick={() => handleTabChange("5v5")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-semibold"
                >
                  5v5
                </TabsTrigger>
              </TabsList>

              {["4v4", "5v5", "2v2", "1v1"].map((size) => (
                <TabsContent key={size} value={size}>
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(queues) ? (
                      queues
                        .filter(
                          (queue) =>
                            queue?.teamSize === parseInt(size.charAt(0))
                        )
                        .map((queue) => (
                          <ContextMenu key={queue._id}>
                            <ContextMenuTrigger className="block">
                              <Card className="flex overflow-hidden flex-col border-2 shadow-md transition-all duration-200 hover:border-primary/50 hover:shadow-xl">
                                <CardHeader className="bg-gradient-to-r border-b from-muted/60 via-muted/50 to-muted/40 border-border/40">
                                  <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
                                    <div>
                                      <CardTitle className="text-lg font-bold sm:text-xl">
                                        {queue.eloTier.charAt(0).toUpperCase() +
                                          queue.eloTier.slice(1)}{" "}
                                        Queue
                                      </CardTitle>
                                      <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                                        {queue.minElo} - {queue.maxElo} ELO
                                      </p>
                                    </div>
                                    {isPlayerInQueue(queue) ? (
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleLeaveQueue(queue._id)
                                        }
                                        disabled={
                                          joiningQueue === queue._id ||
                                          leavingQueue === queue._id ||
                                          pendingOperations.has(queue._id)
                                        }
                                        size="sm"
                                      >
                                        {leavingQueue === queue._id ||
                                        pendingOperations.has(queue._id) ? (
                                          <>
                                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                            Leaving...
                                          </>
                                        ) : (
                                          "Leave"
                                        )}
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() =>
                                          handleJoinQueue(queue._id)
                                        }
                                        disabled={
                                          joiningQueue === queue._id ||
                                          leavingQueue === queue._id ||
                                          pendingOperations.has(queue._id)
                                        }
                                        size="sm"
                                        className="shadow-md transition-shadow hover:shadow-lg"
                                      >
                                        {joiningQueue === queue._id ||
                                        pendingOperations.has(queue._id) ? (
                                          <>
                                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                            Joining...
                                          </>
                                        ) : (
                                          "Join Queue"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent className="flex flex-col flex-1 p-4 sm:p-6">
                                  {/* Active Players List */}
                                  <div
                                    className="mb-4"
                                    style={{
                                      height: `${
                                        queue.teamSize * 52 +
                                        (queue.teamSize - 1) * 6 +
                                        40
                                      }px`,
                                    }}
                                  >
                                    <div className="flex gap-2 items-center mb-2">
                                      <h4 className="text-sm font-medium">
                                        Players
                                      </h4>
                                      <span className="text-sm text-muted-foreground">
                                        (
                                        {Math.min(
                                          queue.players.length,
                                          queue.teamSize * 2
                                        )}
                                        /{queue.teamSize * 2})
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {getQueueSections(queue).activePlayers
                                        .length > 0 ? (
                                        getQueueSections(
                                          queue
                                        ).activePlayers.map((player, index) => (
                                          <div
                                            key={player.discordId}
                                            className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-muted/40 to-muted/30 border border-border/30 hover:border-primary/30 hover:shadow-sm transition-all duration-200 h-[52px]"
                                          >
                                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                                              <div className="flex gap-1.5 items-center min-w-0">
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded shrink-0">
                                                  #{index + 1}
                                                </span>
                                                <span className="text-xs font-medium break-words line-clamp-1">
                                                  {player.discordNickname}
                                                </span>
                                              </div>
                                              <span className="text-[10px] text-muted-foreground">
                                                {formatJoinTime(
                                                  player.joinedAt
                                                )}
                                              </span>
                                            </div>
                                            <span className="px-1.5 py-0.5 ml-2 text-xs font-semibold rounded text-foreground shrink-0 bg-primary/10">
                                              {player.elo}
                                            </span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="col-span-2 py-8 text-center">
                                          <Users className="mx-auto mb-2 w-8 h-8 text-muted-foreground/50" />
                                          <p className="text-sm text-muted-foreground">
                                            No players in queue
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Waitlist Section */}
                                  <div
                                    className="flex flex-col pt-1.5 mb-1.5 border-t"
                                    style={{ height: "100px" }}
                                  >
                                    <div className="flex justify-between items-center mb-0.5">
                                      <div className="flex gap-2 items-center">
                                        <h4 className="text-xs font-medium">
                                          Waitlist
                                        </h4>
                                        <span className="text-xs text-muted-foreground">
                                          (
                                          {
                                            getQueueSections(queue)
                                              .waitlistPlayers.length
                                          }
                                          )
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col">
                                      {getQueueSections(queue).waitlistPlayers
                                        .length > 0 ? (
                                        <>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            {getQueueSections(queue)
                                              .waitlistPlayers.slice(0, 2)
                                              .map((player, index) => (
                                                <div
                                                  key={player.discordId}
                                                  className="flex items-center justify-between p-1 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/20 hover:border-border/40 hover:shadow-sm transition-all duration-200 h-[44px]"
                                                >
                                                  <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                                                    <div className="flex gap-1 items-center min-w-0">
                                                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted/50 px-1 py-0.5 rounded shrink-0">
                                                        #
                                                        {getQueueSections(queue)
                                                          .activePlayers
                                                          .length +
                                                          index +
                                                          1}
                                                      </span>
                                                      <span className="text-xs font-medium break-words line-clamp-1">
                                                        {player.discordNickname}
                                                      </span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">
                                                      {formatJoinTime(
                                                        player.joinedAt
                                                      )}
                                                    </span>
                                                  </div>
                                                  <span className="px-1.5 py-0.5 ml-2 text-xs font-semibold rounded text-muted-foreground shrink-0 bg-muted/30">
                                                    {player.elo}
                                                  </span>
                                                </div>
                                              ))}
                                          </div>

                                          {getQueueSections(queue)
                                            .waitlistPlayers.length > 2 && (
                                            <Sheet>
                                              <SheetTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="mt-0.5 w-full h-6 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                  View{" "}
                                                  {getQueueSections(queue)
                                                    .waitlistPlayers.length -
                                                    2}{" "}
                                                  more
                                                  <ChevronDown className="ml-1 w-3 h-3" />
                                                </Button>
                                              </SheetTrigger>
                                              <SheetContent
                                                side="bottom"
                                                className="h-[80vh]"
                                              >
                                                <SheetHeader>
                                                  <SheetTitle>
                                                    Waitlist
                                                  </SheetTitle>
                                                  <SheetDescription>
                                                    Players waiting to join the
                                                    queue
                                                  </SheetDescription>
                                                </SheetHeader>
                                                <div className="mt-4 grid gap-2 overflow-y-auto max-h-[calc(80vh-120px)]">
                                                  {getQueueSections(
                                                    queue
                                                  ).waitlistPlayers.map(
                                                    (player, index) => (
                                                      <div
                                                        key={player.discordId}
                                                        className="flex justify-between items-center p-3 rounded-lg bg-muted/20"
                                                      >
                                                        <div className="flex flex-col">
                                                          <div className="flex items-center">
                                                            <span className="mr-2 text-sm font-medium text-muted-foreground">
                                                              #
                                                              {getQueueSections(
                                                                queue
                                                              ).activePlayers
                                                                .length +
                                                                index +
                                                                1}
                                                            </span>
                                                            <span className="text-base">
                                                              {
                                                                player.discordNickname
                                                              }
                                                            </span>
                                                          </div>
                                                          <span className="text-sm text-muted-foreground">
                                                            {formatJoinTime(
                                                              player.joinedAt
                                                            )}
                                                          </span>
                                                        </div>
                                                        <span className="ml-2 text-base text-muted-foreground">
                                                          {player.elo}
                                                        </span>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </SheetContent>
                                            </Sheet>
                                          )}
                                        </>
                                      ) : (
                                        <div className="py-1 text-center">
                                          <Users className="mx-auto mb-0.5 w-4 h-4 text-muted-foreground/50" />
                                          <p className="text-xs text-muted-foreground">
                                            No players in waitlist
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Launch and Fill Buttons */}
                                  <div className="pt-4 mt-auto border-t">
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          handleLaunchMatch(queue._id)
                                        }
                                        disabled={
                                          !canLaunchMatch(queue) ||
                                          joiningQueue === queue._id
                                        }
                                        className="w-full shadow-md transition-shadow hover:shadow-lg"
                                      >
                                        {!hasRequiredPlayers(queue)
                                          ? `Waiting for ${
                                              queue.teamSize * 2 -
                                              queue.players.length
                                            } more players`
                                          : "Launch Match"}
                                      </Button>

                                      {/* Admin Buttons */}
                                      {isAdmin() && (
                                        <div className="flex flex-col gap-2 mt-2">
                                          <Button
                                            variant="secondary"
                                            onClick={() =>
                                              handleFillQueue(queue._id, true)
                                            }
                                            disabled={
                                              joiningQueue === queue._id
                                            }
                                            className="w-full"
                                          >
                                            Fill Queue
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() =>
                                              handleClearQueue(queue._id)
                                            }
                                            disabled={
                                              joiningQueue === queue._id ||
                                              queue.players.length === 0
                                            }
                                            className="w-full"
                                          >
                                            Clear Queue
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-64">
                              <ContextMenuItem
                                onClick={() => copyToClipboard(queue.queueId)}
                              >
                                <Copy className="mr-2 w-4 h-4" />
                                Copy Queue ID
                              </ContextMenuItem>

                              {isDeveloperOrAdmin() && (
                                <>
                                  <ContextMenuSeparator />
                                  {canManageMaps() && (
                                    <ContextMenuItem
                                      onClick={() => {
                                        setManagingMapsQueue(queue);
                                        setMapsDialogOpen((prev) => ({
                                          ...prev,
                                          [queue._id]: true,
                                        }));
                                      }}
                                    >
                                      <MapPin className="mr-2 w-4 h-4" />
                                      Manage Maps
                                    </ContextMenuItem>
                                  )}
                                  <ContextMenuSub>
                                    <ContextMenuSubTrigger>
                                      <UserMinus className="mr-2 w-4 h-4" />
                                      Remove Player
                                    </ContextMenuSubTrigger>
                                    <ContextMenuSubContent className="w-48">
                                      {queue.players.length > 0 ? (
                                        queue.players.map(
                                          (
                                            player: QueuePlayer,
                                            index: number
                                          ) => (
                                            <ContextMenuItem
                                              key={player.discordId}
                                              onClick={() =>
                                                handleRemovePlayer(
                                                  queue._id,
                                                  player.discordId,
                                                  player.discordNickname
                                                )
                                              }
                                            >
                                              <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                #{index + 1}
                                              </span>
                                              {player.discordNickname}
                                            </ContextMenuItem>
                                          )
                                        )
                                      ) : (
                                        <ContextMenuItem disabled>
                                          No players in queue
                                        </ContextMenuItem>
                                      )}
                                    </ContextMenuSubContent>
                                  </ContextMenuSub>

                                  <ContextMenuSeparator />
                                  {/* Simple Delete Queue option at the bottom with destructive style */}
                                  <ContextMenuItem
                                    onClick={() =>
                                      handleDeleteQueue(
                                        queue._id,
                                        queue.name,
                                        queue.eloTier || "any", // Add eloTier
                                        queue.teamSize // Add teamSize
                                      )
                                    }
                                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                  >
                                    <Trash2 className="mr-2 w-4 h-4" />
                                    Delete Queue
                                  </ContextMenuItem>
                                </>
                              )}
                            </ContextMenuContent>
                          </ContextMenu>
                        ))
                    ) : (
                      <div>Loading queues...</div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
      {playerToRemove && (
        <AlertDialog
          open={!!playerToRemove}
          onOpenChange={() => setPlayerToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Player</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {playerToRemove.playerName} from
                the queue? This action cannot be undone.
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
      {queueToDelete && (
        <AlertDialog
          open={!!queueToDelete}
          onOpenChange={() => setQueueToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Queue</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this queue? This action cannot
                be undone.
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
      {process.env.NODE_ENV === "development" && (
        <div className="hidden">
          <pre>
            {JSON.stringify(
              {
                session: session,
                userId: session?.user?.id,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Manage Maps Dialog */}
      <Dialog
        open={
          managingMapsQueue
            ? mapsDialogOpen[managingMapsQueue._id] || false
            : false
        }
        onOpenChange={(open) => {
          if (!open && managingMapsQueue) {
            setMapsDialogOpen((prev) => ({
              ...prev,
              [managingMapsQueue._id]: false,
            }));
            setManagingMapsQueue(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Manage Map Pool</DialogTitle>
            <DialogDescription>
              Select which maps are available for {managingMapsQueue?.gameType}{" "}
              {managingMapsQueue?.eloTier}
            </DialogDescription>
          </DialogHeader>
          <div className="flex overflow-hidden flex-col flex-1 space-y-4">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() =>
                  managingMapsQueue && selectAllMaps(managingMapsQueue._id)
                }
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() =>
                  managingMapsQueue && deselectAllMaps(managingMapsQueue._id)
                }
              >
                Deselect All
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {managingMapsQueue &&
                maps.map((map) => {
                  const isSelected = (
                    selectedMaps[managingMapsQueue._id] || []
                  ).includes(map._id);
                  return (
                    <div
                      key={map._id}
                      className={cn(
                        "flex gap-3 items-center p-2 rounded-lg border transition-colors",
                        isSelected
                          ? "bg-primary/10 border-primary/50"
                          : "border-transparent bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          managingMapsQueue &&
                          toggleMapSelection(managingMapsQueue._id, map._id)
                        }
                      />
                      <div className="overflow-hidden relative w-12 h-12 rounded shrink-0">
                        <Image
                          src={map.src}
                          alt={map.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {map.name}
                        </p>
                        <div className="flex gap-2 items-center text-xs text-muted-foreground">
                          <span>{map.gameMode}</span>
                          {map.rankedMap && (
                            <Badge variant="outline" className="text-[10px]">
                              Ranked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (managingMapsQueue) {
                  setMapsDialogOpen((prev) => ({
                    ...prev,
                    [managingMapsQueue._id]: false,
                  }));
                  setManagingMapsQueue(null);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (managingMapsQueue && !saving[managingMapsQueue._id]) {
                  try {
                    await handleSaveMaps(managingMapsQueue);
                  } catch (error) {
                    // Error already handled in handleSaveMaps
                  }
                }
              }}
              disabled={
                managingMapsQueue ? saving[managingMapsQueue._id] : false
              }
            >
              {managingMapsQueue && saving[managingMapsQueue._id] ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 w-4 h-4" />
                  Save Map Pool
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FeatureGate>
  );
}
