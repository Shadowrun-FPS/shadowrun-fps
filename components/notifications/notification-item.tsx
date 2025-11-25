import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  Check, 
  X, 
  Users, 
  Trash2, 
  Loader2, 
  Shield, 
  UserPlus, 
  UserMinus,
  Crown,
  Mail,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch team size for team invite notifications
  useEffect(() => {
    if (notification.type === "team_invite" && notification.metadata?.teamId) {
      fetch(`/api/teams/${notification.metadata.teamId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.teamSize) {
            setTeamSize(data.teamSize);
          }
        })
        .catch(() => {
          // Silently fail - team size is optional
        });
    }
  }, [notification.type, notification.metadata?.teamId]);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "team_invite":
        return <Users className="h-4 w-4" />;
      case "team_join_request":
        return <UserPlus className="h-4 w-4" />;
      case "team_captain_transfer":
      case "team_captain":
        return <Crown className="h-4 w-4" />;
      case "team_member_joined":
        return <UserPlus className="h-4 w-4" />;
      case "team_member_left":
        return <UserMinus className="h-4 w-4" />;
      case "moderation":
        return <Shield className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTeamSizeLabel = (size: number) => {
    switch (size) {
      case 2:
        return "2v2";
      case 3:
        return "3v3";
      case 4:
        return "4v4";
      case 5:
        return "5v5";
      default:
        return `${size}-person`;
    }
  };

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
        // Redirect to team page using tag (slug) if available, otherwise use teamId
        // Prefer teamTag from response, then from notification metadata, then fallback to teamId
        const teamIdentifier = data.teamTag || notification.metadata?.teamTag || notification.metadata?.teamId;
        setTimeout(() => {
          router.push(`/tournaments/teams/${teamIdentifier}`);
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
    <div className={`relative p-3 ${notification.read ? "opacity-75" : ""} ${!notification.read ? "bg-gradient-to-r from-accent/40 via-accent/20 to-card border-l-4 border-l-primary" : "bg-card border-l-4 border-l-transparent"} transition-all duration-200 hover:bg-accent/30 hover:shadow-sm`}>
      {!notification.read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
      )}
      <div className="flex items-start gap-2.5">
        <div className={`rounded-full p-1.5 flex-shrink-0 transition-colors ${notification.read ? "bg-muted/50" : notification.type === "team_invite" ? "bg-blue-500/20 ring-2 ring-blue-500/20" : "bg-primary/10 ring-2 ring-primary/10"}`}>
          <div className={notification.read ? "text-muted-foreground" : notification.type === "team_invite" ? "text-blue-500" : "text-primary"}>
            {getNotificationIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className={`text-sm font-semibold break-words ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                {notification.title}
              </h4>
              {notification.type === "team_invite" && teamSize && (
                <Badge variant="outline" className="text-xs font-medium border-primary/30 bg-primary/5 px-1.5 py-0">
                  {getTeamSizeLabel(teamSize)}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 font-medium">{timeAgo}</span>
          </div>
          <p className="text-sm text-muted-foreground break-words leading-snug">
            {notification.message}
          </p>

          {notification.type === "team_join_request" && (
            <TeamJoinRequest
              notification={notification}
              onActionComplete={handleActionComplete}
            />
          )}

          {notification.type === "team_invite" && !processed && (
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 mt-3 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="default"
                onClick={() => handleTeamInviteResponse("reject")}
                disabled={isSubmitting}
                className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-[40px] border-2 border-destructive/40 text-destructive font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60 transition-all shadow-sm"
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
                size="default"
                onClick={() => handleTeamInviteResponse("accept")}
                disabled={isSubmitting}
                className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-[40px] bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-medium"
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
            <div className="mt-1.5">
              <p className="text-sm w-full text-center py-1">
                {actionResult === "accepted" ? (
                  <span className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    Invite accepted. Joining team...
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center justify-center gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Invite declined
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="mt-2.5 flex flex-col sm:flex-row justify-end gap-2">
            {!notification.read &&
              onMarkAsRead &&
              notification.type !== "team_invite" && (
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => onMarkAsRead(notification._id)}
                  className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-[38px] font-medium border-2 hover:bg-accent/50 transition-colors"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark as read
                </Button>
              )}
            {onDelete && (
              <Button
                size="default"
                variant="ghost"
                className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation min-h-[44px] sm:min-h-[38px] font-medium border border-destructive/20 hover:border-destructive/30 transition-all"
                onClick={() => onDelete(notification._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
