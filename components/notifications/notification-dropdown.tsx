"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Notification {
  _id: string;
  type: "team_invite" | "role_change" | "team_removal" | "queue_full";
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  data?: {
    queueId?: string;
    queueName?: string;
    queueType?: string;
    teamSize?: number;
    redirectUrl?: string;
    expiresAt?: Date;
    [key: string]: any;
  };
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(300); // Start with default 5 min

  useEffect(() => {
    // Parse the expiration date
    const expirationDate = new Date(expiresAt);

    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = expirationDate.getTime() - now.getTime();
      return Math.max(0, Math.floor(diff / 1000));
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-center w-full my-2 text-center">
      <span
        className={`font-medium text-sm ${
          timeLeft < 60 ? "text-red-500" : "text-blue-500"
        }`}
      >
        {timeLeft > 0 ? `Time left: ${formattedTime}` : "Time expired!"}
      </span>
    </div>
  );
}

export function NotificationDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/notifications");

        if (response.status === 401) {
          // User is not logged in, handle gracefully
          setNotifications([]);
          setUnreadCount(0);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        // Only log error if user is logged in
        if (session?.user) {
          console.error("Error fetching notifications:", error);
        }
        // Set empty state
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              className={`p-4 ${notification.read ? "opacity-60" : ""} ${
                notification.type === "queue_full"
                  ? "bg-blue-50 dark:bg-blue-950/30"
                  : ""
              }`}
              onClick={() => {
                handleMarkAsRead(notification._id);

                // Only navigate on the item click if it's not a queue notification
                if (
                  notification.type !== "queue_full" &&
                  notification.data?.redirectUrl
                ) {
                  router.push(notification.data.redirectUrl);
                }
              }}
            >
              <div className="w-full space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{notification.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), "p")}
                  </span>
                </div>

                {notification.type === "queue_full" ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{notification.message}</p>
                    </div>
                    {notification.data?.expiresAt && (
                      <div className="flex items-center mt-1">
                        <CountdownTimer
                          expiresAt={notification.data.expiresAt.toString()}
                        />
                      </div>
                    )}
                    {notification.data && (
                      <div className="flex items-center mt-2">
                        <Badge variant="secondary" className="mr-2">
                          {notification.data.teamSize}v
                          {notification.data.teamSize}
                        </Badge>
                        <Badge variant="outline">
                          {notification.data.queueType || "Ranked"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/matches/queues#4v4");
                          }}
                        >
                          View Queue
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
