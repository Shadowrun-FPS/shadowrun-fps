"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ReadyCheckProps {
  matchId: string;
  playerId: string;
}

export function ReadyCheck({ matchId, playerId }: ReadyCheckProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleReadyCheck = async () => {
    if (isLoading || isReady) return; // Prevent duplicate submissions
    setIsLoading(true);
    try {
      const response = await fetch("/api/matches/ready-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          playerId,
          status: "ready",
        }),
      });

      if (!response.ok) throw new Error("Failed to update ready status");

      const data = await response.json();
      setIsReady(true);

      if (data.allReady) {
        toast({
          title: "Match Starting",
          description: "All players are ready. The match will begin shortly.",
        });
        router.refresh();
      } else {
        toast({
          title: "Ready Status Updated",
          description: "Waiting for other players...",
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ready status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReadyCheck}
      disabled={isReady || isLoading}
      variant={isReady ? "secondary" : "default"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isReady ? (
        "Ready!"
      ) : (
        "Ready Check"
      )}
    </Button>
  );
}
