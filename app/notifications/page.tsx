"use client";

import { useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface NotificationsContentProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onActionComplete: () => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedNotifications, setPaginatedNotifications] = useState<
    Notification[]
  >([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  // Fetch notifications with pagination (only when page changes or explicitly requested)
  const fetchNotificationsWithPagination = useCallback(
    async (page: number = 1, force = false) => {
      if (!session?.user) return;

      // Use context data for page 1 if available and not forcing refresh
      if (page === 1 && !force && notifications.length > 0) {
        setPaginatedNotifications(notifications);
        setPagination({
          page: 1,
          limit: 50,
          total: notifications.length,
          totalPages: 1,
          hasMore: false,
        });
        return;
      }

      try {
        setPageLoading(true);
        const response = await fetch(
          `/api/notifications?page=${page}&limit=50`
        );
        if (!response.ok) throw new Error("Failed to fetch notifications");
        const data = await response.json();

        if (data.pagination) {
          setPagination(data.pagination);
          setPaginatedNotifications(data.notifications || []);
        } else if (Array.isArray(data)) {
          // Fallback for old format
          setPaginatedNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        });
      } finally {
        setPageLoading(false);
      }
    },
    [session?.user, toast, notifications]
  );

  // Only fetch paginated data when page changes, or use context data for page 1
  useEffect(() => {
    // Wait for context to load first to avoid duplicate calls
    if (loading) return;
    
    if (currentPage === 1 && notifications.length > 0) {
      // Use context data for first page (no additional API call needed)
      setPaginatedNotifications(notifications);
      setPagination({
        page: 1,
        limit: 50,
        total: notifications.length,
        totalPages: 1,
        hasMore: false,
      });
    } else if (currentPage === 1 && notifications.length === 0 && !loading) {
      // Only fetch if context hasn't loaded yet and we're not loading
      fetchNotificationsWithPagination(currentPage);
    } else if (currentPage > 1) {
      // Fetch paginated data for other pages
      fetchNotificationsWithPagination(currentPage);
    }
  }, [currentPage, notifications, loading, fetchNotificationsWithPagination]);

  const handleRefresh = () => {
    // Refresh context (which will update notifications)
    fetchNotifications(true).then(() => {
      // After context refresh, update paginated view
      fetchNotificationsWithPagination(currentPage, true);
      toast({
        title: "Refreshed",
        description: "Notifications refreshed",
      });
    });
  };

  // Use paginated notifications for display, but keep context notifications for counts
  const userNotifications = session?.user
    ? paginatedNotifications.filter(
        (notification) => notification.userId === session.user?.id
      )
    : paginatedNotifications;

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
      <div className="container px-3 py-6 mx-auto max-w-4xl sm:px-4 md:px-6 sm:py-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Notifications
            </h1>
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
          <TabsList className="grid grid-cols-4 p-1 mb-4 w-full max-w-full h-auto sm:max-w-md sm:mb-6">
            <TabsTrigger
              value="all"
              className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation"
            >
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
            <TabsTrigger
              value="unread"
              className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation"
            >
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
            <TabsTrigger
              value="team"
              className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation"
            >
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
            <TabsTrigger
              value="system"
              className="relative py-2 sm:py-2.5 text-xs sm:text-sm touch-manipulation"
            >
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
              loading={loading || pageLoading}
              onMarkAsRead={async (id: string) => {
                await markAsRead(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onDelete={async (id: string) => {
                await deleteNotification(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onActionComplete={() => {
                fetchNotifications();
                fetchNotificationsWithPagination(currentPage);
              }}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.unread}
              loading={loading || pageLoading}
              onMarkAsRead={async (id: string) => {
                await markAsRead(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onDelete={async (id: string) => {
                await deleteNotification(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onActionComplete={() => {
                fetchNotifications();
                fetchNotificationsWithPagination(currentPage);
              }}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.team}
              loading={loading || pageLoading}
              onMarkAsRead={async (id: string) => {
                await markAsRead(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onDelete={async (id: string) => {
                await deleteNotification(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onActionComplete={() => {
                fetchNotifications();
                fetchNotificationsWithPagination(currentPage);
              }}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </TabsContent>

          <TabsContent value="system" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.system}
              loading={loading || pageLoading}
              onMarkAsRead={async (id: string) => {
                await markAsRead(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onDelete={async (id: string) => {
                await deleteNotification(id);
                await fetchNotificationsWithPagination(currentPage);
              }}
              onActionComplete={() => {
                fetchNotifications();
                fetchNotificationsWithPagination(currentPage);
              }}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
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
  pagination,
  currentPage = 1,
  onPageChange,
}: NotificationsContentProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-start sm:gap-4">
                <Skeleton className="flex-shrink-0 w-8 h-8 rounded-full sm:w-10 sm:h-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-3/4 h-3 sm:h-4" />
                  <Skeleton className="w-1/2 h-3 sm:h-4" />
                  <div className="flex gap-2 justify-end mt-2">
                    <Skeleton className="w-16 h-7 sm:w-20 sm:h-8" />
                    <Skeleton className="w-16 h-7 sm:w-20 sm:h-8" />
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
        <CardContent className="flex flex-col justify-center items-center p-8 sm:p-12">
          <div className="p-3 mb-3 rounded-full sm:p-4 sm:mb-4 bg-primary/10">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h3 className="mb-2 text-base font-medium sm:text-lg">
            No notifications
          </h3>
          <p className="px-4 max-w-sm text-sm text-center sm:text-base text-muted-foreground">
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
          <div className="flex gap-1.5 items-center px-1 mb-1.5">
            <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <h3 className="text-xs font-medium text-muted-foreground">
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

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex flex-col gap-4 items-center mt-6">
          <div className="flex gap-2 justify-center items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <ChevronLeft className="mr-1 w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-1 items-center">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      disabled={loading}
                      className="min-w-[40px] touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange(Math.min(pagination.totalPages, currentPage + 1))
              }
              disabled={currentPage === pagination.totalPages || loading}
              className="touch-manipulation min-h-[44px] sm:min-h-0"
            >
              Next
              <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} •{" "}
            {pagination.total} total notifications
          </div>
        </div>
      )}
    </div>
  );
}
