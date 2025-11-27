"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  CheckCircle2,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  Edit,
  Ban,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Queue {
  _id: string;
  queueId: string;
  gameType: string;
  teamSize: number;
  eloTier: string;
  status: string;
  mapPool?: string[] | null;
  minElo?: number;
  maxElo?: number;
}

interface Map {
  _id: string;
  name: string;
  gameMode: string;
  rankedMap: boolean;
  smallOption: boolean;
  src: string;
}

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
  const [queues, setQueues] = useState<Queue[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [originalMaps, setOriginalMaps] = useState<Map[]>([]); // Store original maps without variants
  const [loading, setLoading] = useState(true);
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
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [managingMapsQueue, setManagingMapsQueue] = useState<Queue | null>(
    null
  );
  const [queueName, setQueueName] = useState("");
  const [queueTier, setQueueTier] = useState("");
  const [minElo, setMinElo] = useState("");
  const [maxElo, setMaxElo] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

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

  // Fetch queues and maps
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [queuesRes, mapsRes] = await Promise.all([
          fetch("/api/queues"),
          fetch("/api/maps"),
        ]);

        if (!queuesRes.ok || !mapsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const queuesData = await queuesRes.json();
        const mapsData = await mapsRes.json();

        // Use all maps (same as scrimmage challenges), not just ranked maps
        // Create map variants (normal and small if applicable) - same logic as scrimmage challenges
        const mapsWithVariants: Map[] = [];
        for (const map of mapsData) {
          // Add the regular map
          mapsWithVariants.push({
            ...map,
            _id: `${map._id}-normal`,
            name: map.name,
            src: `/maps/map_${map.name.toLowerCase().replace(/\s+/g, "")}.png`,
          });

          // Add small variant if available
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
        setOriginalMaps(mapsData); // Store original maps for variant checking
        setQueues(queuesData);

        // Initialize selected maps from queue map pools
        // mapPool now contains map objects with _id, name, src, gameMode, isSmall
        const initialSelected: Record<string, string[]> = {};
        queuesData.forEach((queue: Queue) => {
          if (queue.mapPool && Array.isArray(queue.mapPool)) {
            // Convert map objects back to variant IDs for UI state
            const variantIds: string[] = [];
            queue.mapPool.forEach((mapItem: any) => {
              // Handle both old format (variant IDs) and new format (objects)
              if (typeof mapItem === "string") {
                // Backward compatibility: old format with variant IDs
                if (mapsWithVariants.some((m) => m._id === mapItem)) {
                  variantIds.push(mapItem);
                }
              } else if (mapItem && mapItem._id) {
                // New format: map object
                const variantId = mapItem.isSmall
                  ? `${mapItem._id}-small`
                  : `${mapItem._id}-normal`;
                // Verify the variant exists in our maps list
                if (mapsWithVariants.some((m) => m._id === variantId)) {
                  variantIds.push(variantId);
                }
              }
            });
            initialSelected[queue._id] = Array.from(new Set(variantIds));
          } else {
            // If no map pool, select all maps by default
            initialSelected[queue._id] = mapsWithVariants.map((m) => m._id);
          }
        });
        setSelectedMaps(initialSelected);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load queues and maps",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, toast]);

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

  const handleSave = async (queue: Queue): Promise<void> => {
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
        console.error("Error refetching queue data:", refetchError);
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
        description: `Map pool updated for ${queue.gameType} ${queue.eloTier}`,
      });
    } catch (error: any) {
      console.error("Error saving map pool:", error);
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge className="text-green-400 bg-green-500/20 border-green-500/50">
            Active
          </Badge>
        );
      case "open":
        return (
          <Badge className="text-blue-400 bg-blue-500/20 border-blue-500/50">
            Open
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  const getEloTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      mid: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      high: "bg-red-500/20 text-red-400 border-red-500/50",
    };

    return (
      <Badge
        className={
          colors[tier] || "bg-gray-500/20 text-gray-400 border-gray-500/50"
        }
      >
        {tier.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="mb-4 w-full h-8" />
                <Skeleton className="w-3/4 h-4" />
              </CardContent>
            </Card>
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
  }, {} as Record<string, Queue[]>);

  return (
    <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
          Queue Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage map pools and settings for each queue. Customize which maps are
          available and configure queue details.
        </p>
      </div>

      {Object.keys(queuesByTeamSize).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">No queues found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(queuesByTeamSize).map(([teamSize, teamQueues]) => (
            <div key={teamSize}>
              <h2 className="mb-4 text-xl font-semibold">{teamSize} Queues</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamQueues.map((queue) => {
                  const selected = selectedMaps[queue._id] || [];
                  const hasCustomMapPool =
                    queue.mapPool !== null && queue.mapPool !== undefined;

                  return (
                    <Card
                      key={queue._id}
                      className={cn(
                        "transition-all",
                        hasCustomMapPool && "border-primary/50 bg-primary/5"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex gap-2 justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">
                              {queue.gameType}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              <div className="flex flex-wrap gap-2 items-center">
                                {getEloTierBadge(queue.eloTier)}
                                {getStatusBadge(queue.status)}
                              </div>
                            </CardDescription>
                          </div>
                          {hasCustomMapPool && (
                            <Badge variant="outline" className="shrink-0">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <p>Queue ID: {queue.queueId}</p>
                          <p className="mt-1">
                            {(() => {
                              // Count total variant selections (normal + small)
                              const totalSelected = selected.length;
                              // Total available variants = all maps with variants
                              const totalAvailable = maps.length;
                              return `${totalSelected} out of ${totalAvailable}`;
                            })()}
                          </p>
                          {queue.minElo !== undefined &&
                            queue.maxElo !== undefined && (
                              <p className="mt-1">
                                ELO Range: {queue.minElo.toLocaleString()} -{" "}
                                {queue.maxElo.toLocaleString()}
                              </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setEditingQueue(queue);
                              setQueueName(queue.gameType || "");
                              setQueueTier(queue.eloTier || "");
                              setMinElo(queue.minElo?.toString() || "");
                              setMaxElo(queue.maxElo?.toString() || "");
                              setEditDialogOpen((prev) => ({
                                ...prev,
                                [queue._id]: true,
                              }));
                            }}
                          >
                            <Settings className="mr-2 w-4 h-4" />
                            Edit Queue Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
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
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled
                            title="Coming soon: Manage players for this queue"
                          >
                            <Ban className="mr-2 w-4 h-4" />
                            Manage Players
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Soon
                            </Badge>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Queue Details Dialog */}
      <Dialog
        open={editingQueue ? editDialogOpen[editingQueue._id] || false : false}
        onOpenChange={(open) => {
          if (!open && editingQueue) {
            setEditDialogOpen((prev) => ({
              ...prev,
              [editingQueue._id]: false,
            }));
            setEditingQueue(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Edit Queue Details</DialogTitle>
            <DialogDescription>
              Update the queue name, tier, and ELO range for{" "}
              {editingQueue?.gameType} {editingQueue?.eloTier}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="queueName">Queue Name</Label>
              <Input
                id="queueName"
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
                placeholder="e.g., Ranked 4v4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="queueTier">ELO Tier</Label>
              <Select value={queueTier} onValueChange={setQueueTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minElo">Min ELO</Label>
                <Input
                  id="minElo"
                  type="number"
                  value={minElo}
                  onChange={(e) => setMinElo(e.target.value)}
                  placeholder="800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxElo">Max ELO</Label>
                <Input
                  id="maxElo"
                  type="number"
                  value={maxElo}
                  onChange={(e) => setMaxElo(e.target.value)}
                  placeholder="2500"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (editingQueue) {
                  setEditDialogOpen((prev) => ({
                    ...prev,
                    [editingQueue._id]: false,
                  }));
                  setEditingQueue(null);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingQueue) return;

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
                        gameType: queueName,
                        eloTier: queueTier,
                        minElo: minElo ? parseInt(minElo) : undefined,
                        maxElo: maxElo ? parseInt(maxElo) : undefined,
                      }),
                    }
                  );

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "Failed to update");
                  }

                  // Update local state
                  setQueues((prev) =>
                    prev.map((q) =>
                      q._id === editingQueue._id
                        ? {
                            ...q,
                            gameType: queueName,
                            eloTier: queueTier,
                            minElo: minElo ? parseInt(minElo) : q.minElo,
                            maxElo: maxElo ? parseInt(maxElo) : q.maxElo,
                          }
                        : q
                    )
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
                  console.error("Error updating queue details:", error);
                  toast({
                    title: "Error",
                    description:
                      error.message || "Failed to update queue details",
                    variant: "destructive",
                  });
                } finally {
                  setSavingDetails(false);
                }
              }}
              disabled={savingDetails}
            >
              {savingDetails ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          } else if (open && managingMapsQueue) {
            // Ensure selectedMaps is initialized for this queue when modal opens
            // mapPool now contains variant IDs directly
            if (
              !selectedMaps[managingMapsQueue._id] ||
              selectedMaps[managingMapsQueue._id].length === 0
            ) {
              if (
                managingMapsQueue.mapPool &&
                Array.isArray(managingMapsQueue.mapPool)
              ) {
                // mapPool contains variant IDs - use them directly
                // Filter to only include valid variant IDs that exist in our maps list
                const validVariantIds = managingMapsQueue.mapPool.filter(
                  (variantId: string) => maps.some((m) => m._id === variantId)
                );
                setSelectedMaps((prev) => ({
                  ...prev,
                  [managingMapsQueue._id]: Array.from(new Set(validVariantIds)),
                }));
              } else if (!managingMapsQueue.mapPool) {
                // If no map pool, initialize with all maps selected
                setSelectedMaps((prev) => ({
                  ...prev,
                  [managingMapsQueue._id]: maps.map((m) => m._id),
                }));
              }
            }
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
                    await handleSave(managingMapsQueue);
                    setMapsDialogOpen((prev) => ({
                      ...prev,
                      [managingMapsQueue._id]: false,
                    }));
                    setManagingMapsQueue(null);
                  } catch (error) {
                    // Error already handled in handleSave, just don't close dialog
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
    </div>
  );
}
