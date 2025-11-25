"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationsContext";

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
  const { notifications, unreadCount, markAsRead, loading } = useNotifications();
  const router = useRouter();

  // Filter to show only recent notifications in dropdown (last 10)
  const recentNotifications = notifications.slice(0, 10);

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
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-sm text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          recentNotifications.map((notification) => {
            // Map context notification type to dropdown notification type
            const notificationData = notification.metadata || {};
            const isQueueFull = notification.type === "queue_match";
            
            return (
              <DropdownMenuItem
                key={notification._id}
                className={`p-4 ${notification.read ? "opacity-60" : ""} ${
                  isQueueFull
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : ""
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification._id);
                  }

                  // Only navigate on the item click if it's not a queue notification
                  if (
                    !isQueueFull &&
                    notificationData.teamId
                  ) {
                    router.push(`/teams/${notificationData.teamId}`);
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

                {isQueueFull ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{notification.message}</p>
                    </div>
                    {(notificationData as any).expiresAt && (
                      <div className="flex items-center mt-1">
                        <CountdownTimer
                          expiresAt={(notificationData as any).expiresAt.toString()}
                        />
                      </div>
                    )}
                    {notificationData && (
                      <div className="flex items-center mt-2">
                        <Badge variant="secondary" className="mr-2">
                          {(notificationData as any).teamSize || 4}v
                          {(notificationData as any).teamSize || 4}
                        </Badge>
                        <Badge variant="outline">
                          {(notificationData as any).queueType || "Ranked"}
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
          );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
