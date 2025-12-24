"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTimeAgo } from "@/lib/utils/date";

interface Queue {
  _id: string;
  gameType: string; // "1v1", "2v2", "4v4", "5v5"
  eloTier: "low" | "medium" | "high";
  eloRange: { min: number; max: number };
  teamSize: number;
  players: Player[];
  status: "open" | "full" | "closed";
  createdAt: Date;
}

interface Player {
  discordId: string;
  discordNickname: string;
  joinedAt: Date;
}

export default function QueuesTab() {
  const { data: session } = useSession();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [activeGameType, setActiveGameType] = useState("4v4");
  const { toast } = useToast();
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueues = async () => {
      // Only fetch if page is visible (save resources when tab is in background)
      if (document.hidden) return;
      
      try {
        const response = await fetch(`/api/queues?gameType=${activeGameType}`);
        if (!response.ok) {
          // If rate limited, skip this fetch
          if (response.status === 429) {
            return;
          }
          throw new Error("Failed to fetch queues");
        }
        const data = await response.json();
        setQueues(data);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch queues:", error);
        }
      }
    };

    fetchQueues();
    // Increased from 5 seconds to 15 seconds to reduce API calls
    const interval = setInterval(fetchQueues, 15000);
    
    // Stop polling when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchQueues(); // Fetch immediately when tab becomes visible
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeGameType]);

  const handleJoinQueue = async (queue: Queue) => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join queues",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/queues/${queue._id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: session.user.id,
          discordNickname: session.user.name,
        }),
      });

      if (!response.ok) throw new Error("Failed to join queue");

      const updatedQueue = await response.json();
      setQueues(queues.map((q) => (q._id === queue._id ? updatedQueue : q)));

      if (updatedQueue.status === "full") {
        toast({
          title: "Queue Full!",
          description: "The match will begin shortly.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join queue",
        variant: "destructive",
      });
    }
  };

  const handleLeaveQueue = async (queue: Queue) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/queues/${queue._id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: session.user.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to leave queue");

      const updatedQueue = await response.json();
      setQueues(queues.map((q) => (q._id === queue._id ? updatedQueue : q)));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave queue",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-8 text-3xl font-bold">Ranked Matchmaking</h1>

      <Tabs
        defaultValue="4v4"
        className="w-full max-w-3xl mb-8"
        onValueChange={setActiveGameType}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="1v1">1v1</TabsTrigger>
          <TabsTrigger value="2v2">2v2</TabsTrigger>
          <TabsTrigger value="4v4">4v4</TabsTrigger>
          <TabsTrigger value="5v5">5v5</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {queues
          .filter((q) => q.gameType === activeGameType)
          .map((queue) => (
            <div
              key={queue._id}
              className="p-6 space-y-4 rounded-lg shadow-md bg-card"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {queue.gameType} {queue.eloTier} Queue
                </h2>
                <span className="text-sm text-muted-foreground">
                  {queue.eloRange.min}-{queue.eloRange.max} ELO
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Players</span>
                  <span>
                    {queue.players.length} / {queue.teamSize * 2}
                  </span>
                </div>
                <div className="space-y-2">
                  {queue.players.map((player) => (
                    <div
                      key={player.discordId}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <span className="text-sm">{player.discordNickname}</span>
                    </div>
                  ))}
                  {Array.from({
                    length: queue.teamSize * 2 - queue.players.length,
                  }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/20"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted/20" />
                      <span className="text-sm text-muted-foreground">
                        Waiting...
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {session?.user && (
                <div className="pt-4">
                  {queue.players.some(
                    (p) => p.discordId === session?.user?.id
                  ) ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleLeaveQueue(queue)}
                      disabled={joiningQueue === queue._id}
                      className="w-full"
                    >
                      {joiningQueue === queue._id
                        ? "Leaving..."
                        : "Leave Queue"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleJoinQueue(queue)}
                      disabled={joiningQueue === queue._id}
                      className="w-full bg-[#3b82f6] hover:bg-[#2563eb]"
                    >
                      {joiningQueue === queue._id ? "Joining..." : "Join Queue"}
                    </Button>
                  )}
                </div>
              )}

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Created</span>
                <span>{formatTimeAgo(queue.createdAt)}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
