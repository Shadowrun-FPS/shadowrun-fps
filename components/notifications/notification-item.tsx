import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, X, Users, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamJoinRequest } from "./team-join-request";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: any;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onActionComplete?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onActionComplete,
}: NotificationItemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [actionResult, setActionResult] = useState<
    "accepted" | "rejected" | null
  >(null);
  const { toast } = useToast();
  const router = useRouter();

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const handleMarkAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleActionComplete = () => {
    if (onActionComplete) {
      onActionComplete();
    }
  };

  // Handler for team invite responses
  const handleTeamInviteResponse = async (action: "accept" | "reject") => {
    if (!notification.metadata?.inviteId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/teams/invites/${notification.metadata.inviteId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process invite");
      }

      setProcessed(true);
      setActionResult(action === "accept" ? "accepted" : "rejected");

      // Mark notification as read
      if (onMarkAsRead) {
        onMarkAsRead(notification._id);
      }

      toast({
        title: action === "accept" ? "Team Joined" : "Invite Rejected",
        description: data.message,
        variant: action === "accept" ? "default" : "destructive",
      });

      if (action === "accept") {
        // Redirect to team page
        setTimeout(() => {
          router.push(`/tournaments/teams/${notification.metadata.teamId}`);
          router.refresh();
        }, 1500);
      }

      handleActionComplete();
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

  return (
    <div className={`p-4 ${notification.read ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          {notification.type === "team_invite" ? (
            <Users className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <h4 className="text-sm font-semibold">{notification.title}</h4>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {notification.message}
          </p>

          {notification.type === "team_join_request" && (
            <TeamJoinRequest
              notification={notification}
              onActionComplete={handleActionComplete}
            />
          )}

          {notification.type === "team_invite" && !processed && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTeamInviteResponse("reject")}
                disabled={isSubmitting}
              >
                {isSubmitting && actionResult === null ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Decline
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleTeamInviteResponse("accept")}
                disabled={isSubmitting}
              >
                {isSubmitting && actionResult === null ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Accept
              </Button>
            </div>
          )}

          {notification.type === "team_invite" && processed && (
            <div className="mt-4 mb-1">
              <p className="text-sm w-full text-center">
                {actionResult === "accepted" ? (
                  <span className="text-green-500 font-medium">
                    Invite accepted. Joining team...
                  </span>
                ) : (
                  <span className="text-muted-foreground">Invite declined</span>
                )}
              </p>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            {!notification.read &&
              onMarkAsRead &&
              notification.type !== "team_invite" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAsRead(notification._id)}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Mark as read
                </Button>
              )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(notification._id)}
              >
                <X className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
