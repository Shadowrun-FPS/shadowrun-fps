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
    <div className={`relative p-3 sm:p-4 ${notification.read ? "opacity-70" : ""} ${!notification.read ? "bg-accent/30 border-l-2 border-l-primary" : ""} transition-colors`}>
      {!notification.read && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
      )}
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`rounded-full p-1.5 sm:p-2 flex-shrink-0 ${notification.read ? "bg-muted" : "bg-primary/10"}`}>
          {notification.type === "team_invite" ? (
            <Users className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${notification.read ? "text-muted-foreground" : "text-primary"}`} />
          ) : (
            <Bell className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${notification.read ? "text-muted-foreground" : "text-primary"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
            <h4 className="text-sm sm:text-base font-semibold break-words">{notification.title}</h4>
            <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground break-words">
            {notification.message}
          </p>

          {notification.type === "team_join_request" && (
            <TeamJoinRequest
              notification={notification}
              onActionComplete={handleActionComplete}
            />
          )}

          {notification.type === "team_invite" && !processed && (
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3 sm:mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTeamInviteResponse("reject")}
                disabled={isSubmitting}
                className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-0"
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
                className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-0"
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

          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row justify-end gap-2">
            {!notification.read &&
              onMarkAsRead &&
              notification.type !== "team_invite" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAsRead(notification._id)}
                  className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Mark as read
                </Button>
              )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10 touch-manipulation min-h-[44px] sm:min-h-0"
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
