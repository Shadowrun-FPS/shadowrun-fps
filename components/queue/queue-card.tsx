"use client";

import { formatDistance } from "date-fns/formatDistance";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Queue, Player } from "@/types/types";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

interface QueueCardProps {
  queue: Queue;
  onJoin: (queue: Queue) => Promise<void>;
  onLeave: (queue: Queue) => Promise<void>;
}

export function QueueCard({ queue, onJoin, onLeave }: QueueCardProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAction = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join queues",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isInQueue = queue.players.some(
        (p) => p.discordId === session.user.id
      );
      if (isInQueue) {
        await onLeave(queue);
      } else {
        await onJoin(queue);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getQueueStatus = () => {
    const playerCount = queue.players.length;
    const maxPlayers = queue.teamSize * 2;
    const percentage = (playerCount / maxPlayers) * 100;

    return (
      <div className="flex items-center gap-2">
        <div className="w-full h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all",
              percentage === 100
                ? "bg-green-500"
                : percentage > 50
                ? "bg-yellow-500"
                : "bg-blue-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {playerCount}/{maxPlayers}
        </span>
      </div>
    );
  };

  const currentPlayer = queue.players.find(
    (p: Player) => p.discordId === session?.user?.id
  );

  const timeAgo = currentPlayer?.joinedAt
    ? formatDistance(new Date(currentPlayer.joinedAt), new Date(), {
        addSuffix: true,
      })
    : "";

  return (
    <div className="p-6 space-y-6 rounded-lg shadow-lg bg-card">
      {/* Queue status */}
      {getQueueStatus()}

      {/* Join/Leave button */}
      <Button
        className="w-full"
        onClick={handleAction}
        disabled={isLoading || queue.players.length >= queue.teamSize * 2}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : queue.players.some((p) => p.discordId === session?.user?.id) ? (
          "Leave Queue"
        ) : (
          "Join Queue"
        )}
      </Button>

      {/* View Match button - only show if matchId exists */}
      {queue.matchId && (
        <Link href={`/matches/${queue.matchId}`} className="flex items-center">
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">View match details</span>
          </Button>
        </Link>
      )}
    </div>
  );
}
