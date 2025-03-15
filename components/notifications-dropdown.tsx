"use client";

import { useState } from "react";
import {
  Bell,
  Users,
  Shield,
  GamepadIcon,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/contexts/NotificationsContext";
import { NotificationBadge } from "@/components/notification-badge";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    resetUnreadCount,
  } = useNotifications();

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    await markAsRead(notification._id);

    // Navigate based on notification type
    switch (notification.type) {
      case "team_invite":
        router.push(`/teams/invites`);
        break;
      case "moderation":
        router.push(`/profile/moderation`);
        break;
      case "queue_match":
        router.push(`/matches/${notification.metadata?.matchId}`);
        break;
      case "team_member_joined":
      case "team_member_left":
        router.push(`/teams/${notification.metadata?.teamId}`);
        break;
    }

    setOpen(false);
  };

  const handleAcceptTeamInvite = async (notification: any) => {
    try {
      const response = await fetch(
        `/api/teams/${notification.metadata?.teamId}/accept-invite`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to accept team invite");

      toast({
        title: "Team Invite Accepted",
        description: `You've joined ${notification.metadata?.teamName}`,
      });

      await markAsRead(notification._id);
      router.push(`/teams/${notification.metadata?.teamId}`);
      setOpen(false);
    } catch (error) {
      console.error("Error accepting team invite:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept team invite",
      });
    }
  };

  const handleDeclineTeamInvite = async (notification: any) => {
    try {
      const response = await fetch(
        `/api/teams/${notification.metadata?.teamId}/decline-invite`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to decline team invite");

      toast({
        title: "Team Invite Declined",
      });

      await markAsRead(notification._id);
    } catch (error) {
      console.error("Error declining team invite:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to decline team invite",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "team_invite":
        return <Users className="h-4 w-4 mr-2" />;
      case "moderation":
        return <Shield className="h-4 w-4 mr-2" />;
      case "queue_match":
        return <GamepadIcon className="h-4 w-4 mr-2" />;
      case "team_member_joined":
        return <UserPlus className="h-4 w-4 mr-2" />;
      case "team_member_left":
        return <UserMinus className="h-4 w-4 mr-2" />;
      default:
        return <Bell className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onContextMenu={(e) => {
            e.preventDefault();
            resetUnreadCount();
          }}
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge className="absolute -top-1 -right-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-destructive"
                onClick={resetUnreadCount}
              >
                Reset count
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="py-6 text-center">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : notifications.length > 0 ? (
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <div key={notification._id} className="relative">
                  <DropdownMenuItem
                    className={`p-4 cursor-pointer ${
                      !notification.read ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {notification.metadata?.userAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={notification.metadata.userAvatar} />
                          <AvatarFallback>
                            {notification.metadata.userName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </DropdownMenuItem>

                  {notification.type === "team_invite" && (
                    <div className="flex gap-2 px-4 pb-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineTeamInvite(notification)}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptTeamInvite(notification)}
                      >
                        Accept
                      </Button>
                    </div>
                  )}

                  <DropdownMenuSeparator />
                </div>
              ))}
            </DropdownMenuGroup>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No new notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
