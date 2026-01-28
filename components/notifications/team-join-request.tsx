"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/contexts/NotificationsContext";

// Batch fetcher for join request statuses
class JoinRequestBatchFetcher {
  private cache = new Map<string, { status: string; timestamp: number }>();
  private pendingRequests = new Map<string, Array<(status: string) => void>>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly BATCH_DELAY = 100; // Wait 100ms to collect requests

  getCachedStatus(teamId: string, requestId: string): string | null {
    const key = `${teamId}-${requestId}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.status;
    }
    return null;
  }

  async getStatus(teamId: string, requestId: string): Promise<string> {
    const key = `${teamId}-${requestId}`;

    // Check cache first
    const cached = this.getCachedStatus(teamId, requestId);
    if (cached) {
      return cached;
    }

    // Add to batch queue
    return new Promise<string>((resolve) => {
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, []);
      }
      this.pendingRequests.get(key)!.push(resolve);

      // Schedule batch fetch
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), this.BATCH_DELAY);
      }
    });
  }

  private async executeBatch() {
    this.batchTimeout = null;
    const requests = Array.from(this.pendingRequests.entries());
    if (requests.length === 0) return;

    // Clear pending
    this.pendingRequests.clear();

    const requestData = requests.map(([key]) => {
      const [teamId, requestId] = key.split("-");
      return { teamId, requestId };
    });

    try {
      const response = await fetch("/api/teams/join-requests/batch-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: requestData }),
      });

      if (response.ok) {
        const { statuses } = await response.json();

        // Update cache and resolve promises
        requests.forEach(([key, resolvers]) => {
          const status = statuses[key] || "pending";
          this.cache.set(key, { status, timestamp: Date.now() });
          resolvers.forEach((resolve) => resolve(status));
        });
      } else {
        // On error, resolve with "pending" status
        requests.forEach(([key, resolvers]) => {
          resolvers.forEach((resolve) => resolve("pending"));
        });
      }
    } catch (error) {
      // On error, resolve with "pending" status
      requests.forEach(([key, resolvers]) => {
        resolvers.forEach((resolve) => resolve("pending"));
      });
    }
  }

  invalidate(teamId: string, requestId: string) {
    const key = `${teamId}-${requestId}`;
    this.cache.delete(key);
  }
}

// Global batch fetcher instance
const batchFetcher = new JoinRequestBatchFetcher();

interface TeamJoinRequestProps {
  notification: any;
  onActionComplete: () => void;
}

export function TeamJoinRequest({
  notification,
  onActionComplete,
}: TeamJoinRequestProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [actionTaken, setActionTaken] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { toast } = useToast();
  const { markAsRead } = useNotifications();

  // Check the status of the join request when component mounts
  useEffect(() => {
    const checkRequestStatus = async () => {
      if (!notification.metadata?.requestId || !notification.metadata?.teamId) {
        setCheckingStatus(false);
        return;
      }

      // Skip if already processed in metadata
      if (
        notification.metadata?.status === "accepted" ||
        notification.metadata?.status === "rejected"
      ) {
        setCheckingStatus(false);
        return;
      }

      try {
        // Use batch fetcher to get status
        const status = await batchFetcher.getStatus(
          notification.metadata.teamId,
          notification.metadata.requestId
        );

        if (status !== "pending" && status !== "not_found") {
          setActionTaken(true);
          setActionResult(
            status === "accepted"
              ? "Player added to your team"
              : status === "rejected"
              ? "Join request declined"
              : "Join request processed"
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error checking join request status:", error);
        }
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRequestStatus();
  }, [
    notification.metadata?.requestId,
    notification.metadata?.teamId,
    notification.metadata?.status,
  ]);

  const handleAction = async (action: "accept" | "reject") => {
    if (loading) return; // Prevent duplicate submissions
    if (!notification.metadata?.requestId) {
      // If there's no requestId in metadata, we need to find the request first
      try {
        setLoading(true);
        const findResponse = await fetch(
          `/api/teams/${notification.metadata.teamId}/join-requests/find?userId=${notification.metadata.requesterId}`
        );

        if (!findResponse.ok) {
          throw new Error("Could not find join request");
        }

        const { requestId } = await findResponse.json();
        if (!requestId) {
          throw new Error("No active join request found");
        }

        notification.metadata.requestId = requestId;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Could not process join request",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/teams/${notification.metadata.teamId}/join-requests/${notification.metadata.requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} request`);
      }

      // After successful action
      setActionTaken(true);
      setActionResult(
        action === "accept"
          ? "Player added to your team"
          : "Join request declined"
      );

      // Invalidate cache for this join request
      batchFetcher.invalidate(
        notification.metadata.teamId,
        notification.metadata.requestId
      );

      toast({
        title: "Success",
        description:
          action === "accept"
            ? "Player added to your team"
            : "Join request declined",
      });

      await markAsRead(notification._id);

      router.refresh();
      onActionComplete();
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Error ${action}ing join request:`, error);
      }
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} request`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking status
  if (checkingStatus) {
    return (
      <div className="mt-2 flex justify-end">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If action already taken, show result instead of buttons
  if (actionTaken) {
    return (
      <div className="mt-2">
        <p className={`text-sm ${actionResult?.includes("added") ? "text-green-500" : "text-muted-foreground"}`}>
          {actionResult}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row justify-end gap-2.5">
      <Button
        size="default"
        variant="outline"
        className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-[40px] border-2 border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/60 font-medium shadow-sm transition-all"
        onClick={() => handleAction("reject")}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <X className="w-4 h-4 mr-2" />
        )}
        Decline
      </Button>
      <Button
        size="default"
        className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-[40px] bg-green-600 hover:bg-green-700 font-medium shadow-md hover:shadow-lg transition-all"
        onClick={() => handleAction("accept")}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        Accept
      </Button>
    </div>
  );
}
