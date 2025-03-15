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

  // Get active notifications based on current tab
  const activeNotifications =
    categorizedNotifications[
      activeTab as keyof typeof categorizedNotifications
    ] || [];

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              Stay updated with all your team activities and announcements
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
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

        {unreadCount > 0 && (
          <div className="flex justify-end mb-6">
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all as read
            </Button>
          </div>
        )}

        {error && (
          <div>
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-6">
            <TabsTrigger value="all" className="relative">
              <span className="flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" />
                <span>All</span>
              </span>
              {categorizedNotifications.all.length > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {categorizedNotifications.all.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Unread</span>
              </span>
              {unreadCount > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="team" className="relative">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Team</span>
              </span>
              {categorizedNotifications.team.length > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {categorizedNotifications.team.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="relative">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>System</span>
              </span>
              {categorizedNotifications.system.length > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                  {categorizedNotifications.system.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div>
            <div>
              <TabsContent value="all" className="mt-0">
                <NotificationsContent
                  notifications={activeNotifications}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onActionComplete={fetchNotifications}
                />
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                <NotificationsContent
                  notifications={activeNotifications}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onActionComplete={fetchNotifications}
                />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <NotificationsContent
                  notifications={activeNotifications}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onActionComplete={fetchNotifications}
                />
              </TabsContent>

              <TabsContent value="system" className="mt-0">
                <NotificationsContent
                  notifications={activeNotifications}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onActionComplete={fetchNotifications}
                />
              </TabsContent>
            </div>
          </div>
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
        <CardContent className="p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-3/4 h-4" />
                  <Skeleton className="w-1/2 h-4" />
                  <div className="flex justify-end gap-2 mt-2">
                    <Skeleton className="w-20 h-8" />
                    <Skeleton className="w-20 h-8" />
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
        <CardContent className="flex flex-col items-center justify-center p-12">
          <div className="p-4 mb-4 rounded-full bg-primary/10">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">No notifications</h3>
          <p className="max-w-sm text-center text-muted-foreground">
            You don&apos;t have any notifications in this category. They&apos;ll
            appear here when you receive them.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group notifications by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groupedNotifications = notifications.reduce(
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
    <div className="space-y-6">
      {Object.entries(groupedNotifications).map(([date, items]) => (
        <div key={date} className="transition duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {date}
            </h3>
          </div>
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
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
