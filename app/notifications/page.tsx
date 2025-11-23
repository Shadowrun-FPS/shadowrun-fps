"use client";

import { useNotifications } from "@/contexts/NotificationsContext";
import type { Notification } from "@/contexts/NotificationsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "@/components/notifications/notification-item";
import {
  Bell,
  RefreshCw,
  Users,
  Info,
  CheckCircle,
  Shield,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";

interface NotificationsContentProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onActionComplete: () => void;
}

export default function NotificationsPage() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    loading,
    error,
    deleteNotification,
  } = useNotifications();

  const { data: session } = useSession();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const handleRefresh = () => {
    fetchNotifications(true);
    toast({
      title: "Refreshed",
      description: "Notifications refreshed",
    });
  };

  const userNotifications = session?.user
    ? notifications.filter(
        (notification) => notification.userId === session.user?.id
      )
    : notifications;

  // Group notifications by type for tabs
  const categorizedNotifications = useMemo(() => {
    const teamNotifications = userNotifications.filter((n) =>
      n.type.includes("team_")
    );
    const unreadNotifications = userNotifications.filter((n) => !n.read);

    // Fix type comparison for system notifications
    const systemNotifications = userNotifications.filter((n) => {
      // Check the type property more safely
      const notificationType = n.type as string;
      return (
        notificationType.includes("system_") ||
        notificationType === "announcement"
      );
    });

    return {
      all: userNotifications,
      team: teamNotifications,
      unread: unreadNotifications,
      system: systemNotifications,
    };
  }, [userNotifications]);

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-3 sm:px-4 md:px-6 py-6 sm:py-8 mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Stay updated with all your team activities and announcements
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllAsRead}
                className="gap-2 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all as read</span>
                <span className="sm:hidden">Mark all</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2 touch-manipulation min-h-[44px] sm:min-h-0"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 sm:mb-6 border-destructive">
            <CardContent className="p-4 sm:pt-6">
              <p className="text-sm sm:text-base text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-4 mb-4 sm:mb-6 h-auto p-1">
            <TabsTrigger value="all" className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden min-[375px]:inline">All</span>
              </span>
              {categorizedNotifications.all.length > 0 && (
                <span className="absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] sm:text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {categorizedNotifications.all.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden min-[375px]:inline">Unread</span>
              </span>
              {unreadCount > 0 && (
                <span className="absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] sm:text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="team" className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden min-[375px]:inline">Team</span>
              </span>
              {categorizedNotifications.team.length > 0 && (
                <span className="absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] sm:text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {categorizedNotifications.team.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden min-[375px]:inline">System</span>
              </span>
              {categorizedNotifications.system.length > 0 && (
                <span className="absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] sm:text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {categorizedNotifications.system.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.all}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onActionComplete={fetchNotifications}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.unread}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onActionComplete={fetchNotifications}
            />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.team}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onActionComplete={fetchNotifications}
            />
          </TabsContent>

          <TabsContent value="system" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.system}
              loading={loading}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onActionComplete={fetchNotifications}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function NotificationsContent({
  notifications,
  loading,
  onMarkAsRead,
  onDelete,
  onActionComplete,
}: NotificationsContentProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-3/4 h-3 sm:h-4" />
                  <Skeleton className="w-1/2 h-3 sm:h-4" />
                  <div className="flex justify-end gap-2 mt-2">
                    <Skeleton className="w-16 sm:w-20 h-7 sm:h-8" />
                    <Skeleton className="w-16 sm:w-20 h-7 sm:h-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12">
          <div className="p-3 sm:p-4 mb-3 sm:mb-4 rounded-full bg-primary/10">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h3 className="mb-2 text-base sm:text-lg font-medium">No notifications</h3>
          <p className="max-w-sm text-center text-sm sm:text-base text-muted-foreground px-4">
            You don&apos;t have any notifications in this category. They&apos;ll
            appear here when you receive them.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort notifications by date (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Group notifications by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groupedNotifications = sortedNotifications.reduce(
    (acc: Record<string, Notification[]>, notification) => {
      const date = new Date(notification.createdAt).toDateString();
      const groupName =
        date === today
          ? "Today"
          : date === yesterday
          ? "Yesterday"
          : new Date(notification.createdAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            });

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(notification);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {Object.entries(groupedNotifications).map(([date, items]) => (
        <div key={date} className="transition duration-300">
          <div className="flex items-center gap-2 mb-2 sm:mb-3 px-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
              {date}
            </h3>
          </div>
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {items.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    onActionComplete={onActionComplete}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
