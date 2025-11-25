"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/contexts/NotificationsContext";

interface TeamInviteNotificationProps {
  id: string;
  inviteId: string;
  teamId: string;
  teamName: string;
  notificationId?: string; // Add notification ID to mark as read
  onInviteProcessed?: () => void;
}

export function TeamInviteNotification({
  id,
  inviteId,
  teamId,
  teamName,
  notificationId,
  onInviteProcessed,
}: TeamInviteNotificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(
    "pending"
  );
  const { toast } = useToast();
  const router = useRouter();
  const { markAsRead } = useNotifications();

  const handleResponse = async (action: "accept" | "reject") => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/invites/${inviteId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process invite");
      }

      const statusValue = action === "accept" ? "accepted" : "rejected";
      setStatus(statusValue);
      setProcessed(true);

      // Mark notification as read automatically
      if (notificationId) {
        await markAsRead(notificationId);
      }

      toast({
        title: action === "accept" ? "Team Joined" : "Invite Rejected",
        description: data.message,
        variant: action === "accept" ? "default" : "destructive",
      });

      if (action === "accept") {
        // Redirect to team page
        setTimeout(() => {
          router.push(`/tournaments/teams/${teamId}`);
          router.refresh();
        }, 1500);
      }

      if (onInviteProcessed) {
        onInviteProcessed();
      }
    } catch (error: any) {
      console.error(`Error ${action}ing invite:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} invite`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (processed) {
    return (
      <div className="mt-2 mb-1">
        <p className="text-sm w-full">
          {status === "accepted" ? (
            <span className="text-green-500 font-medium">
              Invite accepted. Joining team...
            </span>
          ) : (
            <span className="text-muted-foreground">Invite declined</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse("reject")}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <X className="w-4 h-4 mr-2" />
        )}
        Decline
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={() => handleResponse("accept")}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        Accept
      </Button>
    </div>
  );
}
