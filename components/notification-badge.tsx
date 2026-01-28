"use client";

import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationsContext";

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const { unreadCount, error } = useNotifications();

  // Don't show badge if there's an error or no notifications
  if (error || unreadCount <= 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className={`flex items-center justify-center h-5 w-5 p-0 text-xs ${
        className || ""
      }`}
    >
      {unreadCount}
    </Badge>
  );
}
