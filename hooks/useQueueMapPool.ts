"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { safeLog } from "@/lib/security";
import { adminMapPoolErrorToast, queueApiNetworkErrorToast } from "@/lib/queue-page-toast-messages";
import type { AdminQueueMapVariant, AdminQueueRecord, RuntimeQueue } from "@/types/admin-queue";

interface UseQueueMapPoolResult {
  maps: AdminQueueMapVariant[];
  originalMaps: unknown[];
  selectedMaps: Record<string, string[]>;
  managingMapsQueue: AdminQueueRecord | null;
  mapsDialogOpen: Record<string, boolean>;
  saving: Record<string, boolean>;
  mapPoolSearch: string;
  setMapPoolSearch: (v: string) => void;
  mapPoolDialogFilteredMaps: AdminQueueMapVariant[];
  setManagingMapsQueue: (q: AdminQueueRecord | null) => void;
  setMapsDialogOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleMapPoolDialogOpenChange: (open: boolean) => void;
  toggleMapSelection: (queueId: string, mapId: string) => void;
  selectAllMaps: (queueId: string) => void;
  deselectAllMaps: (queueId: string) => void;
  handleSaveMaps: (queue: AdminQueueRecord) => Promise<void>;
  setMaps: React.Dispatch<React.SetStateAction<AdminQueueMapVariant[]>>;
  setOriginalMaps: React.Dispatch<React.SetStateAction<unknown[]>>;
}

export function useQueueMapPool(
  setQueues: React.Dispatch<React.SetStateAction<RuntimeQueue[]>>,
): UseQueueMapPoolResult {
  const { toast } = useToast();
  const [maps, setMaps] = useState<AdminQueueMapVariant[]>([]);
  const [originalMaps, setOriginalMaps] = useState<unknown[]>([]);
  const [selectedMaps, setSelectedMaps] = useState<Record<string, string[]>>({});
  const [managingMapsQueue, setManagingMapsQueue] = useState<AdminQueueRecord | null>(null);
  const [mapsDialogOpen, setMapsDialogOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [mapPoolSearch, setMapPoolSearch] = useState("");

  const mapPoolDialogFilteredMaps = useMemo(() => {
    const q = mapPoolSearch.trim().toLowerCase();
    if (!q) return maps;
    return maps.filter(
      (m) => m.name.toLowerCase().includes(q) || m.gameMode.toLowerCase().includes(q),
    );
  }, [maps, mapPoolSearch]);

  // Fetch latest mapPool when the dialog opens for a queue
  useEffect(() => {
    if (!managingMapsQueue || maps.length === 0) return;

    const fetchQueueMapPool = async () => {
      try {
        const response = await fetch(`/api/admin/queues/${managingMapsQueue._id}/map-pool`);
        if (!response.ok) throw new Error("Failed to fetch map pool");
        const queueData = (await response.json()) as { mapPool?: unknown[] };

        const variantIds = resolveVariantIds(queueData.mapPool, maps);
        setSelectedMaps((prev) => ({
          ...prev,
          [managingMapsQueue._id]: variantIds,
        }));
      } catch (error) {
        safeLog.error("Error fetching queue map pool:", error);
        // Fallback to queue object's mapPool
        if (managingMapsQueue.mapPool && Array.isArray(managingMapsQueue.mapPool)) {
          const variantIds = resolveVariantIds(managingMapsQueue.mapPool, maps);
          setSelectedMaps((prev) => ({ ...prev, [managingMapsQueue._id]: variantIds }));
        }
      }
    };

    void fetchQueueMapPool();
  }, [managingMapsQueue, maps]);

  const handleMapPoolDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && managingMapsQueue) {
        setMapPoolSearch("");
        setMapsDialogOpen((prev) => ({ ...prev, [managingMapsQueue._id]: false }));
        setManagingMapsQueue(null);
      } else if (open && managingMapsQueue?.mapPool && selectedMaps[managingMapsQueue._id]?.length === 0) {
        const variantIds = resolveVariantIds(managingMapsQueue.mapPool, maps);
        setSelectedMaps((prev) => ({ ...prev, [managingMapsQueue._id]: variantIds }));
      }
    },
    [managingMapsQueue, maps, selectedMaps],
  );

  const toggleMapSelection = useCallback((queueId: string, mapId: string) => {
    setSelectedMaps((prev) => {
      const current = prev[queueId] ?? [];
      const updated = current.includes(mapId)
        ? current.filter((id) => id !== mapId)
        : [...current, mapId];
      return { ...prev, [queueId]: Array.from(new Set(updated)) };
    });
  }, []);

  const selectAllMaps = useCallback(
    (queueId: string) => {
      setSelectedMaps((prev) => ({ ...prev, [queueId]: maps.map((m) => m._id) }));
    },
    [maps],
  );

  const deselectAllMaps = useCallback((queueId: string) => {
    setSelectedMaps((prev) => ({ ...prev, [queueId]: [] }));
  }, []);

  const handleSaveMaps = useCallback(
    async (queue: AdminQueueRecord) => {
      if (saving[queue._id]) return;
      setSaving((prev) => ({ ...prev, [queue._id]: true }));
      try {
        const selected = selectedMaps[queue._id] ?? [];
        if (selected.length === 0) {
          toast({ title: "Select maps first", description: "Choose at least one map for this queue's pool.", variant: "destructive", duration: 4000 });
          return;
        }

        const mapPoolItems = buildMapPoolItems(selected, originalMaps as Array<{ _id: string; name: string; src?: string; gameMode: string; smallOption?: boolean }>);
        const response = await fetch(`/api/admin/queues/${queue._id}/map-pool`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mapPool: mapPoolItems.length > 0 ? mapPoolItems : null }),
        });

        let saveBody: { error?: string; message?: string } = {};
        try { saveBody = await response.json(); } catch { /* non-JSON */ }

        if (!response.ok) {
          const { title, description } = adminMapPoolErrorToast(
            response.status,
            typeof saveBody.error === "string" ? saveBody.error : typeof saveBody.message === "string" ? saveBody.message : undefined,
          );
          toast({ title, description, variant: "destructive", duration: 4000 });
          return;
        }

        // Refetch queues to reflect updated map pool
        const queueRes = await fetch("/api/queues");
        if (queueRes.ok) {
          const queuesData = (await queueRes.json()) as RuntimeQueue[];
          setQueues(queuesData);
        }

        const tierNote = queue.eloTier?.trim() ? ` (${queue.eloTier})` : "";
        toast({ title: "Map pool saved", description: `Updated maps for ${queue.gameType}${tierNote}.` });
        setMapsDialogOpen((prev) => ({ ...prev, [queue._id]: false }));
        setManagingMapsQueue(null);
      } catch (error) {
        safeLog.error("Error saving map pool:", error);
        const { title, description } = queueApiNetworkErrorToast();
        toast({ title, description, variant: "destructive", duration: 4000 });
      } finally {
        setSaving((prev) => ({ ...prev, [queue._id]: false }));
      }
    },
    [saving, selectedMaps, originalMaps, setQueues, toast],
  );

  return {
    maps,
    originalMaps,
    selectedMaps,
    managingMapsQueue,
    mapsDialogOpen,
    saving,
    mapPoolSearch,
    setMapPoolSearch,
    mapPoolDialogFilteredMaps,
    setManagingMapsQueue,
    setMapsDialogOpen,
    handleMapPoolDialogOpenChange,
    toggleMapSelection,
    selectAllMaps,
    deselectAllMaps,
    handleSaveMaps,
    setMaps,
    setOriginalMaps,
  };
}

// ─── private helpers ──────────────────────────────────────────────────────────

function resolveVariantIds(
  mapPool: unknown[] | null | undefined,
  maps: AdminQueueMapVariant[],
): string[] {
  if (!mapPool || !Array.isArray(mapPool)) return [];
  const variantIds: string[] = [];
  for (const item of mapPool) {
    if (typeof item === "string") {
      if (maps.some((m) => m._id === item)) variantIds.push(item);
    } else if (item && typeof item === "object" && "_id" in item) {
      const obj = item as { _id: string; isSmall?: boolean };
      const variantId = obj.isSmall ? `${obj._id}-small` : `${obj._id}-normal`;
      if (maps.some((m) => m._id === variantId)) variantIds.push(variantId);
    }
  }
  return Array.from(new Set(variantIds));
}

function buildMapPoolItems(
  selected: string[],
  originalMaps: Array<{ _id: string; name: string; src?: string; gameMode: string; smallOption?: boolean }>,
) {
  const items: Array<{ _id: string; name: string; src?: string; gameMode: string; isSmall: boolean }> = [];
  const seen = new Set<string>();
  for (const variantId of selected) {
    if (seen.has(variantId)) continue;
    seen.add(variantId);
    const isSmall = variantId.includes("-small");
    const baseId = isSmall ? variantId.replace("-small", "") : variantId.replace("-normal", "");
    const map = originalMaps.find((m) => m._id === baseId);
    if (!map) continue;
    if (isSmall && !map.smallOption) continue;
    items.push({ _id: baseId, name: isSmall ? `${map.name} (Small)` : map.name, src: map.src, gameMode: map.gameMode, isSmall });
  }
  return items;
}
