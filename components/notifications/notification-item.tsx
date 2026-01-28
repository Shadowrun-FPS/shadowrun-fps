import React, { useState, memo, useRef } from "react";
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
  AlertCircle,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TeamJoinRequest } from "./team-join-request";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useSwipeActions } from "@/hooks/useSwipeActions";
import { getNotificationColor, getAvatarGradient, getNotificationMetadata } from "@/lib/notification-design-utils";

interface NotificationItemProps {
  notification: any;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onActionComplete?: () => void;
  densityView?: "comfortable" | "compact" | "list";
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onActionComplete,
  densityView = "comfortable",
}: NotificationItemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [actionResult, setActionResult] = useState<
    "accepted" | "rejected" | null
  >(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const itemRef = useRef<HTMLDivElement>(null);

  // Get team size from notification metadata (should be set when notification is created)
  const teamSize = notification.metadata?.teamSize || null;
  
  // Get color scheme for this notification type
  const colorScheme = getNotificationColor(notification.type);
  
  // Get metadata for display
  const metadata = getNotificationMetadata(notification);

  // Swipe actions for mobile
  const { handlers } = useSwipeActions({
    onSwipeRight: () => {
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification._id);
        toast({
          title: "Marked as read",
          duration: 2000,
        });
      }
    },
    onSwipeLeft: () => {
      if (onDelete) {
        onDelete(notification._id);
        toast({
          title: "Notification deleted",
          duration: 2000,
        });
      }
    },
    threshold: 80,
  });

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

  // Create unique IDs for ARIA
  const titleId = `notification-title-${notification._id}`;
  const messageId = `notification-message-${notification._id}`;
  const actionsId = `notification-actions-${notification._id}`;

  // Density-based padding
  const densityPadding = densityView === "list" ? "p-2" : densityView === "compact" ? "p-2.5" : "p-3";
  const avatarSize = densityView === "list" ? "h-8 w-8" : densityView === "compact" ? "h-9 w-9" : "h-10 w-10";

  return (
    <div
      ref={itemRef}
      className={`relative ${densityPadding} group ${notification.read ? "opacity-80" : ""} ${
        !notification.read 
          ? `bg-gradient-to-r from-accent/40 via-accent/20 to-card border-l-4 ${colorScheme.border} shadow-sm` 
          : "bg-card border-l-4 border-l-transparent"
      } transition-all duration-300 hover:bg-accent/30 hover:shadow-lg hover:scale-[1.005] ${!notification.read && "hover:shadow-primary/10"}`}
      role="article"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      aria-live={!notification.read ? "polite" : "off"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...handlers}
    >
      {!notification.read && (
        <>
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${colorScheme.bg} animate-pulse`} />
          <span className="sr-only">Unread notification</span>
        </>
      )}
      
      {/* Quick actions on hover */}
      {isHovered && !notification.read && onMarkAsRead && (
        <div className="absolute top-2 right-2 flex gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-2 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification._id);
            }}
            aria-label="Quick mark as read"
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Enhanced Avatar */}
        {notification.metadata?.userAvatar || notification.metadata?.userName ? (
          <Avatar className={`${avatarSize} flex-shrink-0 ring-2 ${colorScheme.border} transition-all duration-200 group-hover:scale-110`}>
            {notification.metadata?.userAvatar ? (
              <AvatarImage src={notification.metadata.userAvatar} alt={notification.metadata.userName || ""} />
            ) : null}
            <AvatarFallback className={getAvatarGradient(notification.metadata?.userName)}>
              <span className="text-white font-semibold text-sm">
                {notification.metadata?.userName?.charAt(0) || "?"}
              </span>
            </AvatarFallback>
          </Avatar>
        ) : (
          <div 
            className={`rounded-full p-2 flex-shrink-0 transition-all duration-200 ${colorScheme.bg} ring-2 ${colorScheme.border} group-hover:scale-110`}
            aria-hidden="true"
          >
            <div className={colorScheme.icon}>
              {getNotificationIcon()}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title and Badge */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 
                id={titleId}
                className={`text-sm font-semibold break-words ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
              >
                {notification.title}
              </h4>
              {notification.type === "team_invite" && teamSize && (
                <Badge className={`text-xs font-medium ${colorScheme.badge} px-2 py-0.5`}>
                  {getTeamSizeLabel(teamSize)}
                </Badge>
              )}
            </div>
            <time 
              className="text-xs text-muted-foreground flex-shrink-0 font-medium"
              dateTime={new Date(notification.createdAt).toISOString()}
            >
              {timeAgo}
            </time>
          </div>

          {/* Message */}
          <p 
            id={messageId}
            className={`text-sm text-muted-foreground break-words ${densityView === "list" ? "line-clamp-1" : "leading-snug"}`}
          >
            {notification.message}
          </p>

          {/* Metadata Bar */}
          {densityView !== "list" && metadata.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
              {metadata.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span>{item.icon}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {notification.type === "team_join_request" && (
            <TeamJoinRequest
              notification={notification}
              onActionComplete={handleActionComplete}
            />
          )}

          {notification.type === "team_invite" && !processed && (
            <div className={`flex flex-col sm:flex-row justify-end gap-2.5 ${densityView === "list" ? "mt-2 pt-2" : "mt-3 pt-3"} border-t border-border/50 animate-in fade-in duration-300`}>
              <Button
                variant="outline"
                size={densityView === "list" ? "sm" : "default"}
                onClick={() => handleTeamInviteResponse("reject")}
                disabled={isSubmitting}
                className={`w-full sm:w-auto touch-manipulation ${densityView === "list" ? "min-h-[36px] text-xs" : "min-h-[44px] sm:min-h-[40px]"} border-2 border-destructive/40 text-destructive font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60 transition-all shadow-sm hover:scale-105`}
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
                size={densityView === "list" ? "sm" : "default"}
                onClick={() => handleTeamInviteResponse("accept")}
                disabled={isSubmitting}
                className={`w-full sm:w-auto touch-manipulation ${densityView === "list" ? "min-h-[36px] text-xs" : "min-h-[44px] sm:min-h-[40px]"} bg-green-600 hover:bg-green-700 shadow-md hover:shadow-xl transition-all font-medium hover:scale-105`}
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
            <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={`w-full text-center py-2 rounded-lg ${actionResult === "accepted" ? "bg-green-500/10" : "bg-muted"}`}>
                <p className="text-sm">
                  {actionResult === "accepted" ? (
                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1.5">
                      <Check className="h-4 w-4 animate-bounce" />
                      Invite accepted. Joining team...
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center justify-center gap-1.5">
                      <X className="h-4 w-4" />
                      Invite declined
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {densityView !== "list" && (
            <div 
              id={actionsId}
              className={`flex flex-col sm:flex-row justify-end gap-2 ${densityView === "compact" ? "mt-2" : "mt-2.5"} ${isHovered ? "animate-in fade-in slide-in-from-bottom-2 duration-200" : ""}`}
              role="group"
              aria-label="Notification actions"
            >
              {!notification.read &&
                onMarkAsRead &&
                notification.type !== "team_invite" && (
                  <Button
                    size={densityView === "compact" ? "sm" : "default"}
                    variant="outline"
                    onClick={() => onMarkAsRead(notification._id)}
                    className={`w-full sm:w-auto touch-manipulation ${densityView === "compact" ? "min-h-[36px] text-xs" : "min-h-[44px] sm:min-h-[38px]"} font-medium border-2 hover:bg-accent/50 transition-all hover:scale-105`}
                    aria-label={`Mark notification "${notification.title}" as read`}
                  >
                    <Check className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Mark as read
                  </Button>
                )}
              {onDelete && (
                <Button
                  size={densityView === "compact" ? "sm" : "default"}
                  variant="ghost"
                  className={`w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation ${densityView === "compact" ? "min-h-[36px] text-xs" : "min-h-[44px] sm:min-h-[38px]"} font-medium border border-destructive/20 hover:border-destructive/30 transition-all hover:scale-105`}
                  onClick={() => onDelete(notification._id)}
                  aria-label={`Delete notification "${notification.title}"`}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
