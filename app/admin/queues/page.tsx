"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AdminQueueCard } from "@/components/admin-queue-card";
import { AdminQueueDetailsDialog } from "@/components/admin/queues/admin-queue-details-dialog";
import { AdminQueueMapPoolDialog } from "@/components/admin/queues/admin-queue-map-pool-dialog";
import { AdminQueueBansDialog } from "@/components/admin/queues/admin-queue-bans-dialog";
import { safeLog } from "@/lib/security";
import { containsProfanity } from "@/lib/profanity-filter";
import type {
  AdminQueueMapSource,
  AdminQueueMapVariant,
  AdminQueuePlayerSearchHit,
  AdminQueueRecord,
} from "@/types/admin-queue";
import { usePusherInvalidate } from "@/hooks/usePusherInvalidate";
import {
  QUEUES_LIST_PUSHER_CHANNEL,
  QUEUES_LIST_PUSHER_EVENT,
} from "@/lib/queues-realtime-constants";

interface MapPoolItem {
  _id: string; // Base map ObjectId for validation
  name: string;
  src: string;
  gameMode: string;
  isSmall: boolean; // true for small variant, false for normal
}

export default function AdminQueuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [queues, setQueues] = useState<AdminQueueRecord[]>([]);
  const [maps, setMaps] = useState<AdminQueueMapVariant[]>([]);
  const [originalMaps, setOriginalMaps] = useState<AdminQueueMapSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [selectedMaps, setSelectedMaps] = useState<Record<string, string[]>>(
    {}
  );
  const [editDialogOpen, setEditDialogOpen] = useState<Record<string, boolean>>(
    {}
  );
  const [mapsDialogOpen, setMapsDialogOpen] = useState<Record<string, boolean>>(
    {}
  );
  const [editingQueue, setEditingQueue] = useState<AdminQueueRecord | null>(
    null
  );
  const [managingMapsQueue, setManagingMapsQueue] =
    useState<AdminQueueRecord | null>(null);
  const [queueName, setQueueName] = useState("");
  const [queueTier, setQueueTier] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [minElo, setMinElo] = useState("");
  const [maxElo, setMaxElo] = useState("");
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [customQueueChannel, setCustomQueueChannel] = useState("");
  const [customMatchChannel, setCustomMatchChannel] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [channels, setChannels] = useState<
    { id: string; name: string; type: number }[]
  >([]);
  const [roleSearch, setRoleSearch] = useState("");
  const [bannedPlayersDialogOpen, setBannedPlayersDialogOpen] = useState<
    Record<string, boolean>
  >({});
  const [managingBannedPlayersQueue, setManagingBannedPlayersQueue] =
    useState<AdminQueueRecord | null>(null);
  const [bannedPlayers, setBannedPlayers] = useState<string[]>([]);
  const [bannedPlayersInfo, setBannedPlayersInfo] = useState<
    Record<string, { discordNickname?: string; discordUsername?: string }>
  >({});
  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    AdminQueuePlayerSearchHit[]
  >([]);
  const [savingBannedPlayers, setSavingBannedPlayers] = useState(false);
  const [mapPoolSearch, setMapPoolSearch] = useState("");

  const searchParams = useSearchParams();
  const openBansParamHandledRef = useRef<string | null>(null);

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
          `/api/players/search?q=${encodeURIComponent(discordId)}`
        );
        if (response.ok) {
          const data = await response.json();
          const player = data.players?.find(
            (p: { discordId: string }) => p.discordId === discordId
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
  }, []);

  // Check authorization
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const DEVELOPER_DISCORD_ID = "238329746671271936";
      const isDeveloper =
        session.user.id === "238329746671271936" ||
        session.user.id === DEVELOPER_DISCORD_ID;
      const isAdmin =
        session.user.roles?.includes("admin") || session.user.isAdmin;
      const isFounder = session.user.roles?.includes("founder");

      if (!isDeveloper && !isAdmin && !isFounder) {
        router.push("/");
        return;
      }
    }
  }, [status, session, router]);

  // Fetch roles and channels - use deduplication
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const [rolesData, channelsData] = await Promise.all([
          deduplicatedFetch<{ roles: any[] }>("/api/discord/roles", {
            ttl: 300000, // Cache for 5 minutes (roles don't change often)
          }).catch(() => ({ roles: [] })),
          deduplicatedFetch<{ channels: any[] }>("/api/discord/channels", {
            ttl: 300000, // Cache for 5 minutes
          }).catch(() => ({ channels: [] })),
        ]);
        setRoles(rolesData.roles || []);
        setChannels(channelsData.channels || []);
      } catch (error) {
        safeLog.error("Error fetching roles/channels:", error);
      }
    };
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchQueuesAndMaps = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      try {
        if (silent) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const [queuesData, mapsData] = await Promise.all([
        deduplicatedFetch<any[]>("/api/queues", {
          ttl: 10000,
          useCache: !silent,
          ...(silent ? { cache: "no-store" as RequestCache } : {}),
        }),
        deduplicatedFetch<any[]>("/api/maps", {
          ttl: 60000,
          useCache: !silent,
        }),
      ]);

      const mapsWithVariants: AdminQueueMapVariant[] = [];
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
      setOriginalMaps(mapsData);
      setQueues(queuesData);

      const initialSelected: Record<string, string[]> = {};
      queuesData.forEach((queue: AdminQueueRecord) => {
        if (queue.mapPool && Array.isArray(queue.mapPool)) {
          const variantIds: string[] = [];
          queue.mapPool.forEach((mapItem: any) => {
            if (typeof mapItem === "string") {
              if (mapsWithVariants.some((m) => m._id === mapItem)) {
                variantIds.push(mapItem);
              }
            } else if (mapItem && mapItem._id) {
              const variantId = mapItem.isSmall
                ? `${mapItem._id}-small`
                : `${mapItem._id}-normal`;
              if (mapsWithVariants.some((m) => m._id === variantId)) {
                variantIds.push(variantId);
              }
            }
          });
          initialSelected[queue._id] = Array.from(new Set(variantIds));
        } else {
          initialSelected[queue._id] = mapsWithVariants.map((m) => m._id);
        }
      });
      setSelectedMaps(initialSelected);
    } catch (error) {
      safeLog.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load queues and maps",
        variant: "destructive",
      });
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  },
  [toast]
);

  usePusherInvalidate(
    status === "authenticated" ? QUEUES_LIST_PUSHER_CHANNEL : null,
    QUEUES_LIST_PUSHER_EVENT,
    () => {
      void fetchQueuesAndMaps({ silent: true });
    }
  );

  useEffect(() => {
    if (status === "authenticated") {
      void fetchQueuesAndMaps();
    }
  }, [status, fetchQueuesAndMaps]);

  // Deep link from match queues: /admin/queues?openBans=<queue Mongo _id>
  useEffect(() => {
    const openBansId = searchParams.get("openBans");
    if (!openBansId) {
      openBansParamHandledRef.current = null;
      return;
    }
    if (loading) return;
    if (openBansParamHandledRef.current === openBansId) return;

    const queue = queues.find((q) => q._id === openBansId);
    if (!queue) {
      if (queues.length > 0) {
        openBansParamHandledRef.current = openBansId;
        router.replace("/admin/queues", { scroll: false });
      }
      return;
    }

    openBansParamHandledRef.current = openBansId;
    void openBannedPlayersDialogForQueue(queue);
    router.replace("/admin/queues", { scroll: false });
  }, [
    loading,
    queues,
    searchParams,
    openBannedPlayersDialogForQueue,
    router,
  ]);

  const toggleMapSelection = (queueId: string, mapId: string) => {
    setSelectedMaps((prev) => {
      const current = prev[queueId] || [];

      // Extract base ID from variant ID
      const baseId = mapId.replace(/-normal$/, "").replace(/-small$/, "");

      // If selecting a variant, check if the other variant is already selected
      // If so, we might want to keep both or handle it differently
      // For now, we'll allow both variants to be selected (they'll deduplicate on save)

      // Remove duplicates and toggle the selection
      const updated = current.includes(mapId)
        ? current.filter((id) => id !== mapId)
        : [...current, mapId];

      // Ensure no duplicates
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

  const handleSave = async (queue: AdminQueueRecord): Promise<void> => {
    // Prevent double-clicks and rapid successive saves
    if (saving[queue._id]) {
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [queue._id]: true }));

      const selected = selectedMaps[queue._id] || [];

      if (selected.length === 0) {
        throw new Error("Please select at least one map");
      }

      // Convert selected variant IDs to map objects for storage
      // Each variant ID is like "baseId-normal" or "baseId-small"
      const mapPoolItems: MapPoolItem[] = [];
      const processedVariants = new Set<string>(); // Track to avoid duplicates

      selected.forEach((variantId: string) => {
        if (processedVariants.has(variantId)) return; // Skip duplicates

        // Extract base ID and variant type
        let baseId: string;
        let isSmall: boolean;

        if (variantId.includes("-normal")) {
          baseId = variantId.replace("-normal", "");
          isSmall = false;
        } else if (variantId.includes("-small")) {
          baseId = variantId.replace("-small", "");
          isSmall = true;
        } else {
          // Fallback: treat as normal variant
          baseId = variantId;
          isSmall = false;
        }

        // Find the map in originalMaps
        const map = originalMaps.find((m) => m._id === baseId);
        if (!map) return; // Skip if map not found

        // Validate small variant
        if (isSmall && !map.smallOption) {
          return; // Skip if map doesn't support small variant
        }

        // Create map pool item
        mapPoolItems.push({
          _id: baseId, // Keep ObjectId for validation
          name: isSmall ? `${map.name} (Small)` : map.name,
          src: map.src,
          gameMode: map.gameMode,
          isSmall: isSmall,
        });

        processedVariants.add(variantId);
      });

      // Retry logic for rate limiting
      let response: Response | null = null;
      let retries = 3;
      let lastError: Error | null = null;

      while (retries > 0) {
        try {
          response = await fetch(`/api/admin/queues/${queue._id}/map-pool`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mapPool: mapPoolItems.length > 0 ? mapPoolItems : null,
            }),
          });

          if (response.ok) {
            break; // Success, exit retry loop
          }

          // Handle rate limiting
          if (response.status === 429) {
            const errorData = await response.json().catch(() => ({}));
            const retryAfter = response.headers.get("Retry-After");
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000; // Default 2 seconds

            if (retries > 1) {
              // Wait before retrying
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              retries--;
              continue;
            } else {
              // Last retry failed
              throw new Error(
                errorData.message ||
                  `Rate limit exceeded. Please wait ${
                    retryAfter || "a few"
                  } seconds and try again.`
              );
            }
          }

          // Other errors
          const error = await response.json();
          throw new Error(error.error || error.message || "Failed to save");
        } catch (error: any) {
          lastError = error;
          if (error.message?.includes("Rate limit") && retries > 1) {
            // Wait before retrying rate limit errors
            await new Promise((resolve) => setTimeout(resolve, 2000));
            retries--;
            continue;
          }
          throw error;
        }
      }

      if (!response || !response.ok) {
        if (lastError) {
          throw lastError;
        }
        const error = await response?.json().catch(() => ({}));
        throw new Error(error.error || error.message || "Failed to save");
      }

      // Get the response data to confirm what was saved
      const responseData = await response.json();

      // Refetch the queue data to ensure we have the latest state from the database
      try {
        const queueResponse = await fetch(
          `/api/admin/queues/${queue._id}/map-pool`
        );
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();

          // Update local state with the refetched data
          setQueues((prev) =>
            prev.map((q) =>
              q._id === queue._id
                ? { ...q, mapPool: queueData.mapPool || null }
                : q
            )
          );

          // Update selectedMaps based on the refetched mapPool
          // mapPool now contains map objects - convert to variant IDs for UI state
          if (queueData.mapPool && Array.isArray(queueData.mapPool)) {
            const variantIds: string[] = [];
            queueData.mapPool.forEach((mapItem: any) => {
              // Handle both old format (variant IDs) and new format (objects)
              if (typeof mapItem === "string") {
                // Backward compatibility: old format
                variantIds.push(mapItem);
              } else if (mapItem && mapItem._id) {
                // New format: map object
                const variantId = mapItem.isSmall
                  ? `${mapItem._id}-small`
                  : `${mapItem._id}-normal`;
                variantIds.push(variantId);
              }
            });
            setSelectedMaps((prev) => ({
              ...prev,
              [queue._id]: Array.from(new Set(variantIds)),
            }));
          }
        }
      } catch (refetchError) {
        safeLog.error("Error refetching queue data:", refetchError);
        // Fallback to using response data (which contains map objects)
        const savedMapPool = responseData.mapPool || mapPoolItems;
        setQueues((prev) =>
          prev.map((q) =>
            q._id === queue._id
              ? { ...q, mapPool: savedMapPool.length > 0 ? savedMapPool : null }
              : q
          )
        );

        // Convert map objects to variant IDs for UI state
        const variantIds: string[] = [];
        if (Array.isArray(savedMapPool)) {
          savedMapPool.forEach((mapItem: any) => {
            if (typeof mapItem === "string") {
              variantIds.push(mapItem);
            } else if (mapItem && mapItem._id) {
              const variantId = mapItem.isSmall
                ? `${mapItem._id}-small`
                : `${mapItem._id}-normal`;
              variantIds.push(variantId);
            }
          });
        }
        setSelectedMaps((prev) => ({
          ...prev,
          [queue._id]: Array.from(new Set(variantIds)),
        }));
      }

      toast({
        title: "Success",
        description: `Map pool updated for ${queue.gameType}${
          queue.eloTier?.trim() ? ` (${queue.eloTier})` : ""
        }`,
      });
    } catch (error: any) {
      safeLog.error("Error saving map pool:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save map pool",
        variant: "destructive",
      });
      throw error; // Re-throw so caller can handle it
    } finally {
      setSaving((prev) => ({ ...prev, [queue._id]: false }));
    }
  };

  const customPoolCount = useMemo(
    () =>
      queues.filter(
        (q) => q.mapPool !== null && q.mapPool !== undefined
      ).length,
    [queues]
  );

  const copyQueueId = useCallback(
    (queue: AdminQueueRecord) => {
      void navigator.clipboard.writeText(queue.queueId);
      toast({
        title: "Copied",
        description: "Queue ID copied to clipboard",
      });
    },
    [toast]
  );

  const copyChannelId = useCallback(
    (channelId: string, description: string) => {
      void navigator.clipboard.writeText(channelId);
      toast({
        title: "Copied",
        description: `${description} copied to clipboard`,
      });
    },
    [toast]
  );

  const mapPoolDialogFilteredMaps = useMemo(() => {
    const q = mapPoolSearch.trim().toLowerCase();
    if (!q) return maps;
    return maps.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.gameMode.toLowerCase().includes(q)
    );
  }, [maps, mapPoolSearch]);

  const handleEditQueueDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && editingQueue) {
        setEditDialogOpen((prev) => ({
          ...prev,
          [editingQueue._id]: false,
        }));
        setEditingQueue(null);
      }
    },
    [editingQueue]
  );

  const saveQueueDetails = useCallback(async () => {
    if (!editingQueue) return;
    const trimmedQueueName = queueName.trim();
    if (!trimmedQueueName) {
      toast({
        title: "Error",
        description: "Queue name is required.",
        variant: "destructive",
      });
      return;
    }
    if (trimmedQueueName.length > 50) {
      toast({
        title: "Error",
        description: "Queue name must be 50 characters or less.",
        variant: "destructive",
      });
      return;
    }
    if (containsProfanity(trimmedQueueName)) {
      toast({
        title: "Error",
        description: "Queue name contains inappropriate language.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSavingDetails(true);
      const response = await fetch(
        `/api/admin/queues/${editingQueue._id}/details`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gameType: trimmedQueueName,
            teamSize: teamSize ? parseInt(teamSize) : undefined,
            eloTier: queueTier.trim(),
            minElo: minElo ? parseInt(minElo) : undefined,
            maxElo: maxElo ? parseInt(maxElo) : undefined,
            requiredRoles:
              requiredRoles.length > 0 ? requiredRoles : undefined,
            customQueueChannel: customQueueChannel || undefined,
            customMatchChannel: customMatchChannel || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      const nextTier = queueTier.trim();
      setQueues((prev) =>
        prev.map((q) => {
          if (q._id !== editingQueue._id) return q;
          const { eloTier: _prevTier, ...rest } = q;
          return {
            ...rest,
            gameType: trimmedQueueName,
            teamSize: teamSize ? parseInt(teamSize) : q.teamSize,
            ...(nextTier ? { eloTier: nextTier } : {}),
            minElo: minElo ? parseInt(minElo) : q.minElo,
            maxElo: maxElo ? parseInt(maxElo) : q.maxElo,
            requiredRoles:
              requiredRoles.length > 0 ? requiredRoles : q.requiredRoles,
            customQueueChannel:
              customQueueChannel || q.customQueueChannel,
            customMatchChannel:
              customMatchChannel || q.customMatchChannel,
          };
        })
      );

      toast({
        title: "Success",
        description: "Queue details updated successfully",
      });

      setEditDialogOpen((prev) => ({
        ...prev,
        [editingQueue._id]: false,
      }));
      setEditingQueue(null);
    } catch (error: any) {
      safeLog.error("Error updating queue details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update queue details",
        variant: "destructive",
      });
    } finally {
      setSavingDetails(false);
    }
  }, [
    editingQueue,
    queueName,
    teamSize,
    queueTier,
    minElo,
    maxElo,
    requiredRoles,
    customQueueChannel,
    customMatchChannel,
    toast,
  ]);

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
            const validVariantIds = managingMapsQueue.mapPool.filter(
              (variantId: string) => maps.some((m) => m._id === variantId)
            );
            setSelectedMaps((prev) => ({
              ...prev,
              [managingMapsQueue._id]: Array.from(new Set(validVariantIds)),
            }));
          } else if (!managingMapsQueue.mapPool) {
            setSelectedMaps((prev) => ({
              ...prev,
              [managingMapsQueue._id]: maps.map((m) => m._id),
            }));
          }
        }
      }
    },
    [managingMapsQueue, maps, selectedMaps]
  );

  const handleBannedPlayerSearchChange = useCallback(
    async (search: string) => {
      setPlayerSearch(search);
      if (search.length >= 3) {
        try {
          const response = await fetch(
            `/api/players/search?q=${encodeURIComponent(search)}`
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
    },
    []
  );

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
    [managingBannedPlayersQueue]
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
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      setQueues((prev) =>
        prev.map((q) =>
          q._id === managingBannedPlayersQueue._id
            ? { ...q, bannedPlayers }
            : q
        )
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
    } catch (error: any) {
      safeLog.error("Error updating banned players:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to update banned players",
        variant: "destructive",
      });
    } finally {
      setSavingBannedPlayers(false);
    }
  }, [managingBannedPlayersQueue, bannedPlayers, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="mb-6 flex flex-wrap gap-8 border-b border-border/40 pb-4">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-border/40 bg-card"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-2.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-4/5 max-w-[200px]" />
                <Skeleton className="h-3 w-full max-w-[220px]" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group queues by team size
  const queuesByTeamSize = queues.reduce((acc, queue) => {
    const key = `${queue.teamSize}v${queue.teamSize}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(queue);
    return acc;
  }, {} as Record<string, AdminQueueRecord[]>);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Queues
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Map pools, Discord channels, role gates, and queue-specific bans.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={() => void fetchQueuesAndMaps({ silent: true })}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            aria-hidden
          />
          Refresh
        </Button>
      </div>

      <div className="mb-8 flex flex-wrap gap-x-10 gap-y-4 border-b border-border/40 pb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Queues
          </p>
          <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-foreground">
            {queues.length}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Custom map pools
          </p>
          <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-foreground">
            {customPoolCount}
          </p>
        </div>
      </div>

      {Object.keys(queuesByTeamSize).length === 0 ? (
        <div className="rounded-lg border border-border/40 bg-card/30 px-6 py-14 text-center">
          <AlertCircle
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">No queues found</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(queuesByTeamSize).map(([teamSize, teamQueues]) => (
            <div key={teamSize}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {teamSize}
                </h2>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamQueues.map((queue) => {
                  const selected = selectedMaps[queue._id] || [];
                  const hasCustomMapPool =
                    queue.mapPool !== null && queue.mapPool !== undefined;

                  return (
                    <AdminQueueCard
                      key={queue._id}
                      queue={queue}
                      roles={roles}
                      channels={channels}
                      selectedMapCount={selected.length}
                      totalMapCount={maps.length}
                      hasCustomMapPool={hasCustomMapPool}
                      onEditDetails={() => {
                        setEditingQueue(queue);
                        setQueueName(queue.gameType || "");
                        setQueueTier(queue.eloTier || "");
                        setTeamSize(queue.teamSize?.toString() || "");
                        setMinElo(queue.minElo?.toString() || "");
                        setMaxElo(queue.maxElo?.toString() || "");
                        setRequiredRoles(queue.requiredRoles || []);
                        setCustomQueueChannel(queue.customQueueChannel || "");
                        setCustomMatchChannel(queue.customMatchChannel || "");
                        setEditDialogOpen((prev) => ({
                          ...prev,
                          [queue._id]: true,
                        }));
                      }}
                      onManageMaps={() => {
                        setMapPoolSearch("");
                        setManagingMapsQueue(queue);
                        setMapsDialogOpen((prev) => ({
                          ...prev,
                          [queue._id]: true,
                        }));
                      }}
                      onManageBannedPlayers={() =>
                        void openBannedPlayersDialogForQueue(queue)
                      }
                      onCopyQueueId={() => copyQueueId(queue)}
                      onCopyChannelId={copyChannelId}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Queue admin dialogs — see components/admin/queues/ */}
      <AdminQueueDetailsDialog
        open={editingQueue ? editDialogOpen[editingQueue._id] || false : false}
        onOpenChange={handleEditQueueDialogOpenChange}
        queue={editingQueue}
        queueName={queueName}
        setQueueName={setQueueName}
        teamSize={teamSize}
        setTeamSize={setTeamSize}
        queueTier={queueTier}
        setQueueTier={setQueueTier}
        minElo={minElo}
        setMinElo={setMinElo}
        maxElo={maxElo}
        setMaxElo={setMaxElo}
        requiredRoles={requiredRoles}
        setRequiredRoles={setRequiredRoles}
        customQueueChannel={customQueueChannel}
        setCustomQueueChannel={setCustomQueueChannel}
        customMatchChannel={customMatchChannel}
        setCustomMatchChannel={setCustomMatchChannel}
        roles={roles}
        channels={channels}
        roleSearch={roleSearch}
        setRoleSearch={setRoleSearch}
        savingDetails={savingDetails}
        onSave={saveQueueDetails}
      />
      <AdminQueueMapPoolDialog
        open={
          managingMapsQueue && managingMapsQueue._id
            ? mapsDialogOpen[managingMapsQueue._id] || false
            : false
        }
        onOpenChange={handleMapPoolDialogOpenChange}
        queue={managingMapsQueue}
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
            saving[managingMapsQueue._id]
        )}
        onSave={async () => {
          if (!managingMapsQueue || saving[managingMapsQueue._id]) return;
          try {
            await handleSave(managingMapsQueue);
            setMapsDialogOpen((prev) => ({
              ...prev,
              [managingMapsQueue._id]: false,
            }));
            setManagingMapsQueue(null);
          } catch {
            /* handled in handleSave */
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
    </div>
  );
}
