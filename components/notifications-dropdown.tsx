"use client";

import { useState, useRef, useEffect } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/contexts/NotificationsContext";
import { NotificationBadge } from "@/components/notification-badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    resetUnreadCount,
    fetchNotifications,
  } = useNotifications();

  // Focus trap for accessibility
  useFocusTrap(dropdownRef, open && !isMobile);

  // Fetch notifications when dropdown opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Fetch if empty
      if (notifications.length === 0) {
        fetchNotifications(true);
      }
      // Reset unread count when user opens dropdown (has seen notifications)
      if (unreadCount > 0) {
        resetUnreadCount();
      }
    } else {
      // Return focus to trigger button when closing
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 100);
    }
  };

  // Keyboard shortcut to open notifications (Shift+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptTeamInvite = async (notification: any) => {
    if (isAccepting) return;
    setIsAccepting(true);
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
      router.refresh();
      router.push(`/teams/${notification.metadata?.teamId}`);
      setOpen(false);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error accepting team invite:", error);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept team invite",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const [isDeclining, setIsDeclining] = useState(false);

  const handleDeclineTeamInvite = async (notification: any) => {
    if (isDeclining) return;
    setIsDeclining(true);
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
      router.refresh();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error declining team invite:", error);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to decline team invite",
      });
    } finally {
      setIsDeclining(false);
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

  // Render notification list content (shared between dropdown and sheet)
  const NotificationsList = () => (
    <>
      {loading ? (
        <div className="py-6 text-center">
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((notification) => (
            <div key={notification._id} className="relative">
              <div
                className={`p-4 cursor-pointer rounded-md transition-colors ${
                  !notification.read ? "bg-muted/50" : ""
                } hover:bg-accent`}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
                aria-label={`${notification.title}. ${notification.message}. ${formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}${!notification.read ? '. Unread' : ''}`}
              >
                <div className="flex items-start gap-3 w-full">
                  {notification.metadata?.userAvatar ? (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={notification.metadata.userAvatar} alt="" />
                      <AvatarFallback>
                        {notification.metadata.userName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 flex-shrink-0" aria-hidden="true">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <time className="text-xs text-muted-foreground" dateTime={new Date(notification.createdAt).toISOString()}>
                      {formatDistanceToNow(
                        new Date(notification.createdAt),
                        { addSuffix: true }
                      )}
                    </time>
                  </div>
                  {!notification.read && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" aria-hidden="true"></div>
                      <span className="sr-only">Unread</span>
                    </>
                  )}
                </div>
              </div>

              {notification.type === "team_invite" && (
                <div className="flex gap-2 px-4 pb-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineTeamInvite(notification)}
                    aria-label={`Decline invite to ${notification.metadata?.teamName}`}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptTeamInvite(notification)}
                    aria-label={`Accept invite to ${notification.metadata?.teamName}`}
                  >
                    Accept
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-muted-foreground">
          No new notifications
        </div>
      )}
    </>
  );

  // Mobile: Use bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setOpen(true)}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}. Press Shift+N to toggle`}
          onContextMenu={(e) => {
            e.preventDefault();
            resetUnreadCount();
          }}
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge className="absolute -top-1 -right-1" />
        </Button>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Notifications</SheetTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={markAllAsRead}
                    aria-label="Mark all notifications as read"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="py-4">
              <NotificationsList />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use dropdown menu
  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}. Press Shift+N to toggle`}
          onContextMenu={(e) => {
            e.preventDefault();
            resetUnreadCount();
          }}
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge className="absolute -top-1 -right-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[350px]"
        ref={dropdownRef}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={markAllAsRead}
                aria-label="Mark all notifications as read"
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
                aria-label="Reset unread count"
              >
                Reset count
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          <NotificationsList />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
