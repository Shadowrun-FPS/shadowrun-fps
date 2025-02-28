"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns/formatDistance";
import { FeatureGate } from "@/components/feature-gate";

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  elo: number;
  team?: 1 | 2;
  joinedAt: number;
}

interface Queue {
  _id: string;
  queueId: string;
  gameType: "ranked";
  teamSize: number;
  players: Array<{
    discordId: string;
    discordNickname: string;
    elo: number;
    joinedAt: number;
  }>;
  eloTier: "low" | "mid" | "high";
  minElo: number;
  maxElo: number;
  status: "active" | "inactive";
}

export default function QueuesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [activeTab, setActiveTab] = useState<"4v4" | "5v5" | "2v2" | "1v1">(
    "4v4"
  );
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch("/api/queues");
        if (!response.ok) throw new Error("Failed to fetch queues");
        const data = await response.json();
        setQueues(data);
      } catch (error) {
        console.error("Failed to fetch queues:", error);
      }
    };

    fetchQueues(); // Initial fetch only
  }, []);

  // Add WebSocket/SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/queues/events");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setQueues(data);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleJoinQueue = async (queueId: string) => {
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const response = await fetch(`/api/queues/${queueId}/join`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join queue");
      }

      toast({
        title: "Joined Queue",
        description: "You have joined the queue successfully",
        duration: 2000, // 2 seconds
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to join queue",
        variant: "destructive",
        duration: 2000, // 2 seconds
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  const handleLeaveQueue = async (queueId: string) => {
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const response = await fetch(`/api/queues/${queueId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave queue");
      }

      toast({
        title: "Left Queue",
        description: "You have left the queue successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to leave queue",
        variant: "destructive",
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  const isPlayerInQueue = (queue: Queue) => {
    return queue.players.some((p) => p.discordId === session?.user?.id);
  };

  const hasRequiredPlayers = (queue: Queue) => {
    const requiredPlayers = queue.teamSize * 2;
    return queue.players.length >= requiredPlayers;
  };

  const handleLaunchMatch = async (queueId: string) => {
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const response = await fetch(`/api/queues/${queueId}/launch`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to launch match");
      }

      toast({
        title: "Match Launched",
        description: "The match has been launched successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to launch match",
        variant: "destructive",
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
    const requiredPlayers = queue.teamSize * 2; // This will be 8 for 4v4, 2 for 1v1, etc.
    const sortedPlayers = [...queue.players].sort(
      (a, b) => a.joinedAt - b.joinedAt
    );

    return {
      activePlayers: sortedPlayers.slice(0, requiredPlayers),
      waitlistPlayers: sortedPlayers.slice(requiredPlayers),
    };
  };

  // First, let's add a function to check if the user is an admin or has launch permissions
  const canLaunchMatch = (queue: Queue) => {
    // For now, let anyone launch when there are enough players
    // You can add admin checks here later if needed
    return hasRequiredPlayers(queue);
  };

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
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Ranked Matchmaking</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
                <TabsTrigger value="4v4">4v4</TabsTrigger>
                <TabsTrigger value="5v5">5v5</TabsTrigger>
                <TabsTrigger value="2v2">2v2</TabsTrigger>
                <TabsTrigger value="1v1">1v1</TabsTrigger>
              </TabsList>

              {["4v4", "5v5", "2v2", "1v1"].map((size) => (
                <TabsContent key={size} value={size}>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {queues
                      .filter(
                        (queue) => queue.teamSize === parseInt(size.charAt(0))
                      )
                      .map((queue) => (
                        <Card
                          key={queue._id}
                          className="overflow-hidden min-h-[600px] flex flex-col"
                        >
                          <CardHeader className="bg-muted/50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div>
                                <CardTitle className="text-lg">
                                  {queue.eloTier.charAt(0).toUpperCase() +
                                    queue.eloTier.slice(1)}{" "}
                                  Queue
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {queue.minElo} - {queue.maxElo} ELO
                                </p>
                              </div>
                              {isPlayerInQueue(queue) ? (
                                <Button
                                  variant="destructive"
                                  onClick={() => handleLeaveQueue(queue._id)}
                                  disabled={joiningQueue === queue._id}
                                  size="sm"
                                >
                                  Leave
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleJoinQueue(queue._id)}
                                  disabled={
                                    joiningQueue === queue._id ||
                                    hasRequiredPlayers(queue)
                                  }
                                  size="sm"
                                >
                                  Join Queue
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="flex flex-col flex-1 p-4 sm:p-6">
                            {/* Active Players List */}
                            <div className="flex-1 mb-4">
                              <div className="flex items-center gap-2 mb-2">
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {getQueueSections(queue).activePlayers.length >
                                0 ? (
                                  getQueueSections(queue).activePlayers.map(
                                    (player) => (
                                      <div
                                        key={player.discordId}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                                      >
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-sm truncate">
                                            {player.discordNickname}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {formatJoinTime(player.joinedAt)}
                                          </span>
                                        </div>
                                        <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                          {player.elo}
                                        </span>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <p className="col-span-2 py-2 text-sm text-center text-muted-foreground">
                                    No players in queue
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Waitlist Section */}
                            <div className="pt-4 mb-4 border-t">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-sm font-medium">
                                  Waitlist
                                </h4>
                                <span className="text-sm text-muted-foreground">
                                  (
                                  {
                                    getQueueSections(queue).waitlistPlayers
                                      .length
                                  }
                                  )
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                                {getQueueSections(queue).waitlistPlayers
                                  .length > 0 ? (
                                  getQueueSections(queue).waitlistPlayers.map(
                                    (player) => (
                                      <div
                                        key={player.discordId}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                                      >
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-sm truncate">
                                            {player.discordNickname}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {formatJoinTime(player.joinedAt)}
                                          </span>
                                        </div>
                                        <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                          {player.elo}
                                        </span>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <p className="col-span-2 py-2 text-sm text-center text-muted-foreground">
                                    No players in waitlist
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Launch Button */}
                            <div className="pt-4 mt-auto border-t">
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
                                      queue.teamSize * 2 - queue.players.length
                                    } more players`
                                  : "Launch Match"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
