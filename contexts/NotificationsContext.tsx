"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { safeLocalStorageSet } from "@/lib/client-utils";

export interface Notification {
  _id: string;
  userId: string;
  type:
    | "team_invite"
    | "team_invite_accepted"
    | "moderation"
    | "queue_match"
    | "team_member_joined"
    | "team_member_left"
    | "team_captain_transfer"
    | "team_join_request";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  discordUsername?: string;
  discordNickname?: string;
  metadata?: {
    teamId?: string;
    teamName?: string;
    teamSize?: number;
    matchId?: string;
    moderationId?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    previousCaptainId?: string;
    previousCaptainName?: string;
    requestId?: string;
  };
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: (force?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  bulkMarkAsRead: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  restoreNotification: (notification: Notification) => void;
  loading: boolean;
  resetUnreadCount: () => void;
  error: string | null;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchAttempt, setLastFetchAttempt] = useState(0);

  const syncUnreadCount = (notifs: Notification[]) => {
    const count = notifs.filter((n) => !n.read).length;
    setUnreadCount(count);
    safeLocalStorageSet("notificationCount", count.toString());
    return count;
  };

  const fetchNotifications = async (force = false) => {
    // Don't fetch if user is not authenticated
    if (!session?.user) {
      setNotifications([]);
      setUnreadCount(0);
      safeLocalStorageSet("notificationCount", "0");
      return;
    }

    const now = Date.now();
    // Increase debounce time to 15 seconds to prevent rapid successive calls
    if (!force && now - lastFetchAttempt < 15000) {
      return;
    }

    setLastFetchAttempt(now);

    try {
      setLoading(true);
      setError(null);

      // ✅ Use deduplicated fetch to prevent duplicate calls
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const data = await deduplicatedFetch<Notification[] | {
        notifications: Notification[];
        pagination?: any;
      }>("/api/notifications", {
        ttl: 5000, // Cache for 5 seconds (notifications change frequently)
      });

      // Handle both old format (array) and new format (object with pagination)
      if (Array.isArray(data)) {
        setNotifications(data);
        syncUnreadCount(data);
      } else {
        setNotifications(data.notifications || []);
        syncUnreadCount(data.notifications || []);
      }
    } catch (error: any) {
      // Only log errors in development or for non-auth related issues
      if (
        process.env.NODE_ENV === "development" ||
        (error.message && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error fetching notifications:", error);
      }

      if (error.name === "AbortError") {
        setError("Request timed out. Please try again later.");
      } else if (error.message && error.message.includes("Unauthorized")) {
        // Silently handle auth errors - user just isn't logged in
        setNotifications([]);
        setUnreadCount(0);
        safeLocalStorageSet("notificationCount", "0");
      } else {
        if (process.env.NODE_ENV === "development") {
          setNotifications([]);
          setUnreadCount(0);
          safeLocalStorageSet("notificationCount", "0");
        } else {
          setError("Failed to load notifications. Please try again later.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistically update UI
      const updatedNotifications = notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);

      syncUnreadCount(updatedNotifications);

      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // No need to refetch - optimistic update is sufficient
    } catch (error) {
      // Only log errors in development or for non-auth related issues
      if (
        process.env.NODE_ENV === "development" ||
        (error instanceof Error && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error marking notification as read:", error);
      }
      // Revert optimistic update on error by refetching
      await fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        read: true,
      }));
      setNotifications(updatedNotifications);

      syncUnreadCount(updatedNotifications);

      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
    } catch (error) {
      // Only log errors in development or for non-auth related issues
      if (
        process.env.NODE_ENV === "development" ||
        (error instanceof Error && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error marking all notifications as read:", error);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Optimistically update UI
      const wasUnread = notifications.find((n) => n._id === id && !n.read);
      setNotifications(notifications.filter((n) => n._id !== id));

      if (wasUnread) {
        const newCount = unreadCount - 1;
        setUnreadCount(newCount);
        safeLocalStorageSet("notificationCount", newCount.toString());
      }

      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // No need to refetch - optimistic update is sufficient
    } catch (error) {
      // Only log errors in development or for non-auth related issues
      if (
        process.env.NODE_ENV === "development" ||
        (error instanceof Error && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error deleting notification:", error);
      }
      // Revert optimistic update on error by refetching
      await fetchNotifications(true);
    }
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
    safeLocalStorageSet("notificationCount", "0");
  };

  const bulkMarkAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      // Optimistically update UI
      const updatedNotifications = notifications.map((n) =>
        ids.includes(n._id) ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      syncUnreadCount(updatedNotifications);

      // Make API calls in parallel
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/notifications/${id}/read`, {
            method: "POST",
          })
        )
      );
    } catch (error) {
      if (
        process.env.NODE_ENV === "development" ||
        (error instanceof Error && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error bulk marking notifications as read:", error);
      }
      // Revert optimistic update on error
      await fetchNotifications(true);
    }
  };

  const bulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      // Store notifications for potential undo
      const deletedNotifications = notifications.filter((n) =>
        ids.includes(n._id)
      );

      // Optimistically update UI
      const updatedNotifications = notifications.filter(
        (n) => !ids.includes(n._id)
      );
      setNotifications(updatedNotifications);

      const unreadDeleted = deletedNotifications.filter((n) => !n.read).length;
      if (unreadDeleted > 0) {
        const newCount = Math.max(0, unreadCount - unreadDeleted);
        setUnreadCount(newCount);
        safeLocalStorageSet("notificationCount", newCount.toString());
      }

      // Make API calls in parallel; verify each response so we revert if any fail (e.g. 403)
      const responses = await Promise.all(
        ids.map((id) =>
          fetch(`/api/notifications/${id}`, {
            method: "DELETE",
          })
        )
      );

      const failed = responses.some((r) => !r.ok);
      if (failed) {
        throw new Error("One or more notifications could not be deleted");
      }
    } catch (error) {
      if (
        process.env.NODE_ENV === "development" ||
        (error instanceof Error && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error bulk deleting notifications:", error);
      }
      // Revert optimistic update on error
      await fetchNotifications(true);
    }
  };

  const restoreNotification = (notification: Notification) => {
    // Add the notification back to the list
    setNotifications((prev) => {
      // Check if it already exists (in case of duplicate restore)
      if (prev.some((n) => n._id === notification._id)) {
        return prev;
      }
      return [...prev, notification].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    // Update unread count if notification was unread
    if (!notification.read) {
      const newCount = unreadCount + 1;
      setUnreadCount(newCount);
      safeLocalStorageSet("notificationCount", newCount.toString());
    }
  };

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (!session?.user) {
      setNotifications([]);
      setUnreadCount(0);
      safeLocalStorageSet("notificationCount", "0");
      return;
    }

    // Don't auto-fetch on mount - let components fetch when needed
    // This reduces unnecessary calls when user isn't viewing notifications

    // Increase polling interval to 120 seconds (2 minutes) to reduce API calls
    // Only poll if page is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 120000);
    return () => clearInterval(interval);
  }, [session?.user?.id]); // Only recreate interval when user ID changes, not on every session object change

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        bulkMarkAsRead,
        bulkDelete,
        restoreNotification,
        loading,
        resetUnreadCount,
        error,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
