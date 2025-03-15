"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function QueueButton() {
  const [isJoining, setIsJoining] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false); // New state to track ban status
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkQueueStatus = async () => {
      try {
        setIsLoading(true);

        // First, check if the player is banned
        const banResponse = await fetch("/api/player/ban-status");
        if (banResponse.ok) {
          const banData = await banResponse.json();
          setIsBanned(banData.isBanned);

          // If banned, show a toast and stop further processing
          if (banData.isBanned) {
            toast({
              title: "Access Denied",
              description: banData.banReason
                ? `You are currently banned: ${banData.banReason}`
                : "You are currently banned from matchmaking",
              variant: "destructive",
              duration: 3000, // Auto-disappears after 3 seconds
            });
            setIsLoading(false);
            return;
          }
        }

        // If not banned, check queue status as normal
        const response = await fetch("/api/queue/status");
        if (response.ok) {
          const data = await response.json();
          setIsInQueue(data.inQueue);
        }
      } catch (error) {
        console.error("Error checking queue status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      checkQueueStatus();
    } else {
      setIsLoading(false);
    }
  }, [session, toast]);

  const handleJoinQueue = async () => {
    if (!session?.user) {
      // Redirect to sign-in if not signed in
      router.push("/auth/signin");
      return;
    }

    // Double-check ban status before joining queue
    try {
      const banResponse = await fetch("/api/player/ban-status");
      if (banResponse.ok) {
        const banData = await banResponse.json();

        if (banData.isBanned) {
          toast({
            title: "Access Denied",
            description: "You are currently banned from matchmaking",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }
      }
    } catch (error) {
      console.error("Error checking ban status:", error);
    }

    try {
      setIsJoining(true);
      const response = await fetch("/api/queue/join", {
        method: "POST",
      });

      if (response.ok) {
        setIsInQueue(true);
        toast({
          title: "Success",
          description: "You have joined the queue",
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to join queue",
        });
      }
    } catch (error) {
      console.error("Error joining queue:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join queue. Please try again.",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Rest of component remains the same...
}
