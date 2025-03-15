"use client";

import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useEffect, useRef } from "react";

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const { unreadCount, error, resetUnreadCount } = useNotifications();
  const hasReset = useRef(false);

  // Only reset once on mount, using a ref to track if we've already reset
  useEffect(() => {
    if (unreadCount > 0 && !hasReset.current) {
      hasReset.current = true;
      resetUnreadCount();
    }
  }, [unreadCount, resetUnreadCount]);

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
