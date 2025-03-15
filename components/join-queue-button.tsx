"use client";

import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface JoinQueueButtonProps {
  selectedQueue: {
    id: string;
    name: string;
  };
}

export function JoinQueueButton({ selectedQueue }: JoinQueueButtonProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinQueue = async () => {
    setIsJoining(true);
    console.log("[CLIENT] Attempting to join queue");

    // Add client-side ban check before even attempting to join
    try {
      console.log("[CLIENT] Checking ban status");
      const banCheckResponse = await fetch("/api/bans/check");

      if (!banCheckResponse.ok) {
        console.error(
          "[CLIENT] Ban status check failed:",
          await banCheckResponse.text()
        );
        toast({
          title: "Error",
          description: "Could not verify account status",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      const userData = await banCheckResponse.json();
      console.log("[CLIENT] Ban status result:", userData);

      if (userData.isBanned === true) {
        // User is banned, show message and stop the join attempt
        console.log("[CLIENT] User is banned, stopping queue join");
        toast({
          title: "Cannot Join Queue",
          description: userData.banExpiry
            ? `Your account is banned until ${new Date(
                userData.banExpiry
              ).toLocaleString()}`
            : "Your account has been permanently banned",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }
    } catch (error) {
      console.error("[CLIENT] Failed to check ban status:", error);
    }

    // Continue with normal join process if not banned
    try {
      const response = await fetch("/api/queue/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queueId: selectedQueue.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.message) {
          // Show ban message with more details
          toast({
            title: "Cannot Join Queue",
            description: data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to join queue",
            variant: "destructive",
          });
        }
        setIsJoining(false);
        return;
      }

      // Success handling
      // ...
    } catch (error) {
      // Error handling
      // ...
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Button
      onClick={handleJoinQueue}
      disabled={isJoining || !selectedQueue}
      className="w-full"
    >
      {isJoining ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Joining...
        </>
      ) : (
        <>Join Queue</>
      )}
    </Button>
  );
}
