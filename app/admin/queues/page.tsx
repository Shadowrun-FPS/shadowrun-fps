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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AdminQueuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [selectedMaps, setSelectedMaps] = useState<Record<string, string[]>>({});
  const [editDialogOpen, setEditDialogOpen] = useState<Record<string, boolean>>({});
  const [mapsDialogOpen, setMapsDialogOpen] = useState<Record<string, boolean>>({});
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [managingMapsQueue, setManagingMapsQueue] = useState<Queue | null>(null);
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
      const isAdmin = session.user.roles?.includes("admin") || session.user.isAdmin;
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
              src: `/maps/map_${map.name.toLowerCase().replace(/\s+/g, "")}.png`,
            });
          }
        }

        setMaps(mapsWithVariants);
        setQueues(queuesData);

        // Initialize selected maps from queue map pools
        const initialSelected: Record<string, string[]> = {};
        queuesData.forEach((queue: Queue) => {
          if (queue.mapPool && Array.isArray(queue.mapPool)) {
            initialSelected[queue._id] = queue.mapPool;
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
      if (current.includes(mapId)) {
        return {
          ...prev,
          [queueId]: current.filter((id) => id !== mapId),
        };
      } else {
        return {
          ...prev,
          [queueId]: [...current, mapId],
        };
      }
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
    try {
      setSaving((prev) => ({ ...prev, [queue._id]: true }));

      const selected = selectedMaps[queue._id] || [];
      
      // Convert map IDs back to original map IDs (remove -normal/-small suffix)
      const mapIds = selected.map((id) => {
        if (id.includes("-normal")) {
          return id.replace("-normal", "");
        } else if (id.includes("-small")) {
          return id.replace("-small", "");
        }
        return id;
      });

      // Remove duplicates
      const uniqueMapIds = Array.from(new Set(mapIds));

      const response = await fetch(
        `/api/admin/queues/${queue._id}/map-pool`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mapPool: uniqueMapIds.length > 0 ? uniqueMapIds : null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      // Update local state
      setQueues((prev) =>
        prev.map((q) =>
          q._id === queue._id
            ? { ...q, mapPool: uniqueMapIds.length > 0 ? uniqueMapIds : null }
            : q
        )
      );

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
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            Active
          </Badge>
        );
      case "open":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
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
      <Badge className={colors[tier] || "bg-gray-500/20 text-gray-400 border-gray-500/50"}>
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
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-4 w-3/4" />
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
        <h1 className="text-2xl font-bold sm:text-3xl mb-2">Queue Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage map pools and settings for each queue. Customize which maps are available and configure queue details.
        </p>
      </div>

      {Object.keys(queuesByTeamSize).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No queues found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(queuesByTeamSize).map(([teamSize, teamQueues]) => (
            <div key={teamSize}>
              <h2 className="text-xl font-semibold mb-4">{teamSize} Queues</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamQueues.map((queue) => {
                  const selected = selectedMaps[queue._id] || [];
                  const hasCustomMapPool = queue.mapPool !== null && queue.mapPool !== undefined;

                  return (
                    <Card
                      key={queue._id}
                      className={cn(
                        "transition-all",
                        hasCustomMapPool && "border-primary/50 bg-primary/5"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
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
                            {selected.length} of {maps.length} maps selected
                          </p>
                          {queue.minElo !== undefined && queue.maxElo !== undefined && (
                            <p className="mt-1">
                              ELO Range: {queue.minElo.toLocaleString()} - {queue.maxElo.toLocaleString()}
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
                              setEditDialogOpen((prev) => ({ ...prev, [queue._id]: true }));
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Queue Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setManagingMapsQueue(queue);
                              setMapsDialogOpen((prev) => ({ ...prev, [queue._id]: true }));
                            }}
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Manage Maps
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled
                            title="Coming soon: Manage players for this queue"
                          >
                            <Ban className="w-4 h-4 mr-2" />
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
        open={editingQueue ? (editDialogOpen[editingQueue._id] || false) : false}
        onOpenChange={(open) => {
          if (!open && editingQueue) {
            setEditDialogOpen((prev) => ({ ...prev, [editingQueue._id]: false }));
            setEditingQueue(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Edit Queue Details</DialogTitle>
            <DialogDescription>
              Update the queue name, tier, and ELO range for {editingQueue?.gameType} {editingQueue?.eloTier}
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
                  setEditDialogOpen((prev) => ({ ...prev, [editingQueue._id]: false }));
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

                  setEditDialogOpen((prev) => ({ ...prev, [editingQueue._id]: false }));
                  setEditingQueue(null);
                } catch (error: any) {
                  console.error("Error updating queue details:", error);
                  toast({
                    title: "Error",
                    description: error.message || "Failed to update queue details",
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Maps Dialog */}
      <Dialog
        open={managingMapsQueue ? (mapsDialogOpen[managingMapsQueue._id] || false) : false}
        onOpenChange={(open) => {
          if (!open && managingMapsQueue) {
            setMapsDialogOpen((prev) => ({ ...prev, [managingMapsQueue._id]: false }));
            setManagingMapsQueue(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Manage Map Pool</DialogTitle>
            <DialogDescription>
              Select which maps are available for {managingMapsQueue?.gameType} {managingMapsQueue?.eloTier}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => managingMapsQueue && selectAllMaps(managingMapsQueue._id)}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => managingMapsQueue && deselectAllMaps(managingMapsQueue._id)}
              >
                Deselect All
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {managingMapsQueue && maps.map((map) => {
                const isSelected = (selectedMaps[managingMapsQueue._id] || []).includes(map._id);
                return (
                  <div
                    key={map._id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                      isSelected
                        ? "bg-primary/10 border-primary/50"
                        : "bg-muted/50 border-transparent"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        managingMapsQueue && toggleMapSelection(managingMapsQueue._id, map._id)
                      }
                    />
                    <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden">
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
                      <p className="text-xs text-muted-foreground">
                        {map.gameMode}
                        {map.rankedMap && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            Ranked
                          </Badge>
                        )}
                      </p>
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
                  setMapsDialogOpen((prev) => ({ ...prev, [managingMapsQueue._id]: false }));
                  setManagingMapsQueue(null);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (managingMapsQueue) {
                  try {
                    await handleSave(managingMapsQueue);
                    setMapsDialogOpen((prev) => ({ ...prev, [managingMapsQueue._id]: false }));
                    setManagingMapsQueue(null);
                  } catch (error) {
                    // Error already handled in handleSave, just don't close dialog
                  }
                }
              }}
              disabled={managingMapsQueue ? saving[managingMapsQueue._id] : false}
            >
              {managingMapsQueue && saving[managingMapsQueue._id] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
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

