"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

export interface Notification {
  _id: string;
  userId: string;
  type:
    | "team_invite"
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
    localStorage.setItem("notificationCount", count.toString());
    return count;
  };

  const fetchNotifications = async (force = false) => {
    // Don't fetch if user is not authenticated
    if (!session?.user) {
      setNotifications([]);
      setUnreadCount(0);
      localStorage.setItem("notificationCount", "0");
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/notifications", {
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - skip this call gracefully
          console.warn("Rate limited on notifications fetch");
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        throw new Error(
          `Failed to fetch notifications: ${response.statusText}`
        );
      }

      const data = await response.json();

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
        localStorage.setItem("notificationCount", "0");
      } else {
        if (process.env.NODE_ENV === "development") {
          setNotifications([]);
          setUnreadCount(0);
          localStorage.setItem("notificationCount", "0");
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

      // Refresh notifications to ensure UI is in sync with server
      await fetchNotifications(true);
    } catch (error) {
      // Only log errors in development or for non-auth related issues
      if (
        process.env.NODE_ENV === "development" ||
        (error instanceof Error && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error marking notification as read:", error);
      }
      // Revert optimistic update on error
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
        localStorage.setItem("notificationCount", newCount.toString());
      }

      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // Refresh notifications to ensure UI is in sync with server
      await fetchNotifications(true);
    } catch (error) {
      // Only log errors in development or for non-auth related issues
      if (
        process.env.NODE_ENV === "development" ||
        (error instanceof Error && !error.message.includes("Unauthorized"))
      ) {
        console.error("Error deleting notification:", error);
      }
      // Revert optimistic update on error
      await fetchNotifications(true);
    }
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
    localStorage.setItem("notificationCount", "0");
  };

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (!session?.user) {
      setNotifications([]);
      setUnreadCount(0);
      localStorage.setItem("notificationCount", "0");
      return;
    }

    setUnreadCount(0);
    localStorage.setItem("notificationCount", "0");

    fetchNotifications();

    // Increase polling interval to 120 seconds (2 minutes) to reduce API calls
    const interval = setInterval(() => {
      // Only fetch if page is visible
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
