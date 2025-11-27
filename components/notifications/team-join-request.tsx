"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/contexts/NotificationsContext";

// Cache for join request status checks to prevent duplicate API calls
const joinRequestStatusCache = new Map<string, { status: string; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds
const pendingChecks = new Map<string, Promise<any>>();

interface TeamJoinRequestProps {
  notification: any;
  onActionComplete: () => void;
}

export function TeamJoinRequest({
  notification,
  onActionComplete,
}: TeamJoinRequestProps) {
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

      const cacheKey = `${notification.metadata.teamId}-${notification.metadata.requestId}`;
      
      // Check cache first (extended cache duration for better efficiency)
      const cached = joinRequestStatusCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (cached.status !== "pending") {
          setActionTaken(true);
          setActionResult(
            cached.status === "accepted"
              ? "Player added to your team"
              : cached.status === "rejected"
              ? "Join request declined"
              : "Join request processed"
          );
        }
        setCheckingStatus(false);
        return;
      }

      // Check if there's already a pending request for this join request
      if (pendingChecks.has(cacheKey)) {
        try {
          const data = await pendingChecks.get(cacheKey);
          if (data?.status && data.status !== "pending") {
            setActionTaken(true);
            setActionResult(
              data.status === "accepted"
                ? "Player added to your team"
                : data.status === "rejected"
                ? "Join request declined"
                : "Join request processed"
            );
          }
        } catch (error) {
          // Ignore errors from shared request
        } finally {
          setCheckingStatus(false);
        }
        return;
      }

      // Create new request and share it
      const requestPromise = fetch(
        `/api/teams/${notification.metadata.teamId}/join-requests/${notification.metadata.requestId}`
      )
        .then(async (response) => {
          if (response.ok) {
            const data = await response.json();
            // Cache the result with longer duration
            joinRequestStatusCache.set(cacheKey, {
              status: data.status || "pending",
              timestamp: Date.now(),
            });
            return data;
          }
          return null;
        })
        .catch((error) => {
          console.error("Error checking join request status:", error);
          return null;
        })
        .finally(() => {
          // Remove from pending checks after a longer delay to prevent rapid re-requests
          setTimeout(() => pendingChecks.delete(cacheKey), 5000);
        });

      pendingChecks.set(cacheKey, requestPromise);

      try {
        const data = await requestPromise;
        if (data?.status && data.status !== "pending") {
          setActionTaken(true);
          setActionResult(
            data.status === "accepted"
              ? "Player added to your team"
              : data.status === "rejected"
              ? "Join request declined"
              : "Join request processed"
          );
        }
      } catch (error) {
        // Error already handled in promise
      } finally {
        setCheckingStatus(false);
      }
    };

    // Only check if status is still pending (avoid unnecessary checks)
    if (notification.metadata?.status !== "accepted" && notification.metadata?.status !== "rejected") {
      checkRequestStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [notification.metadata?.requestId, notification.metadata?.teamId, notification.metadata?.status]);

  const handleAction = async (action: "accept" | "reject") => {
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

      toast({
        title: "Success",
        description:
          action === "accept"
            ? "Player added to your team"
            : "Join request declined",
      });

      // Mark notification as read automatically
      await markAsRead(notification._id);

      onActionComplete();
    } catch (error: any) {
      console.error(`Error ${action}ing join request:`, error);
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
