"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

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

      // Mark notification as read
      await fetch(`/api/notifications/${notification._id}/mark-read`, {
        method: "POST",
      });

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

  // If action already taken, show result instead of buttons
  if (actionTaken) {
    return (
      <div className="mt-2">
        <p className="text-sm text-green-500">{actionResult}</p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-red-500 hover:bg-red-500/10"
        onClick={() => handleAction("reject")}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <X className="w-4 h-4 mr-1" />
        )}
        Decline
      </Button>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => handleAction("accept")}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-1" />
        )}
        Accept
      </Button>
    </div>
  );
}
