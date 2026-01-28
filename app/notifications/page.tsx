"use client";

import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { Notification } from "@/contexts/NotificationsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  ArrowDown,
  LayoutGrid,
  List,
  Square,
  X,
} from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useMediaQuery } from "@/hooks/use-media-query";
import { groupNotifications, isGroupedNotification, type GroupedNotification } from "@/lib/notification-grouping";
import { groupNotificationsByTime } from "@/lib/notification-design-utils";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/client-utils";
import { formatDistanceToNow } from "date-fns";

const NOTIFICATIONS_DENSITY_STORAGE_KEY = "notifications-density-view";

function getStoredDensityView(): "comfortable" | "compact" | "list" {
  if (typeof window === "undefined") return "comfortable";
  const stored = safeLocalStorageGet(NOTIFICATIONS_DENSITY_STORAGE_KEY);
  if (stored === "comfortable" || stored === "compact" || stored === "list") {
    return stored;
  }
  return "comfortable";
}

interface NotificationsContentProps {
  notifications: (Notification | GroupedNotification)[];
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
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
  isMobile?: boolean;
  expandedGroups?: Set<string>;
  onToggleGroup?: (groupId: string) => void;
  collapsedDateSections?: Set<string>;
  onToggleDateSection?: (sectionKey: string) => void;
  densityView?: "comfortable" | "compact" | "list";
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
    bulkMarkAsRead,
    bulkDelete,
    restoreNotification,
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [enableGrouping, setEnableGrouping] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [collapsedDateSections, setCollapsedDateSections] = useState<Set<string>>(
    () => new Set(["older"])
  );
  const [densityView, setDensityViewState] = useState<"comfortable" | "compact" | "list">(
    "comfortable"
  );
  const isMobile = useMediaQuery("(max-width: 768px)");
  const notificationRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load density preference from localStorage on mount
  useEffect(() => {
    setDensityViewState(getStoredDensityView());
  }, []);

  const setDensityView = useCallback((value: "comfortable" | "compact" | "list") => {
    setDensityViewState(value);
    safeLocalStorageSet(NOTIFICATIONS_DENSITY_STORAGE_KEY, value);
  }, []);

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

  const handleRefresh = useCallback(async () => {
    // Refresh context (which will update notifications)
    await fetchNotifications(true);
    // After context refresh, update paginated view
    await fetchNotificationsWithPagination(currentPage, true);
    toast({
      title: "Refreshed",
      description: "Notifications refreshed",
    });
  }, [fetchNotifications, fetchNotificationsWithPagination, currentPage, toast]);

  // Pull to refresh
  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: true,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'r',
      callback: () => handleRefresh(),
      description: 'Refresh notifications',
    },
    {
      key: 'a',
      callback: () => {
        if (unreadCount > 0) {
          markAllAsRead();
          toast({ title: "All marked as read" });
        }
      },
      description: 'Mark all as read',
    },
    {
      key: 's',
      callback: () => setSelectionMode((prev) => !prev),
      description: 'Toggle selection mode',
    },
    {
      key: 'Escape',
      callback: () => {
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedIds([]);
        }
      },
      description: 'Exit selection mode',
    },
    {
      key: 'ArrowDown',
      callback: () => {
        setFocusedIndex((prev) => Math.min(prev + 1, userNotifications.length - 1));
      },
      description: 'Navigate down',
    },
    {
      key: 'ArrowUp',
      callback: () => {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      },
      description: 'Navigate up',
    },
  ]);

  // Focus notification when index changes
  useEffect(() => {
    notificationRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  // Bulk actions
  const handleBulkMarkAsRead = useCallback(async () => {
    await bulkMarkAsRead(selectedIds);
    setSelectedIds([]);
    setSelectionMode(false);
    toast({
      title: "Marked as read",
      description: `${selectedIds.length} notifications marked as read`,
    });
  }, [bulkMarkAsRead, selectedIds, toast]);

  const handleBulkDelete = useCallback(async () => {
    const toDelete = notifications.filter((n) => selectedIds.includes(n._id));
    await bulkDelete(selectedIds);
    
    toast({
      title: "Notifications deleted",
      description: `${selectedIds.length} notifications deleted`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toDelete.forEach((n) => restoreNotification(n));
            toast({ title: "Notifications restored" });
          }}
        >
          Undo
        </Button>
      ),
    });
    
    setSelectedIds([]);
    setSelectionMode(false);
  }, [bulkDelete, selectedIds, notifications, restoreNotification, toast]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(userNotifications.map((n) => n._id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Stable callbacks for notification actions
  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await markAsRead(id);
      // Don't refetch - context handles optimistic update
    },
    [markAsRead]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteNotification(id);
      // Don't refetch - context handles optimistic update
    },
    [deleteNotification]
  );

  const handleActionComplete = useCallback(() => {
    // Just refresh context once, not both context and pagination
    fetchNotifications(true);
  }, [fetchNotifications]);

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

    // Apply grouping if enabled
    const grouped = enableGrouping ? {
      all: groupNotifications(userNotifications, enableGrouping),
      team: groupNotifications(teamNotifications, enableGrouping),
      unread: groupNotifications(unreadNotifications, enableGrouping),
      system: groupNotifications(systemNotifications, enableGrouping),
    } : {
      all: userNotifications,
      team: teamNotifications,
      unread: unreadNotifications,
      system: systemNotifications,
    };

    return grouped;
  }, [userNotifications, enableGrouping]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleDateSection = (sectionKey: string) => {
    setCollapsedDateSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  // Among selected notifications, how many are unread (only show "Mark read" when > 0)
  const selectedUnreadCount = useMemo(
    () =>
      userNotifications.filter(
        (n) => selectedIds.includes(n._id) && !n.read
      ).length,
    [userNotifications, selectedIds]
  );

  return (
    <div 
      className="min-h-screen bg-background" 
      {...pullToRefresh.handlers}
      ref={pullToRefresh.containerRef}
      role="main"
      aria-label="Notifications page"
    >
      {/* Pull to refresh indicator */}
      {pullToRefresh.isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 flex justify-center items-center bg-primary/10 z-50 transition-all"
          style={{ 
            height: `${pullToRefresh.pullDistance}px`,
            opacity: pullToRefresh.progress / 100 
          }}
          aria-live="polite"
          aria-label={pullToRefresh.isRefreshing ? "Refreshing notifications" : "Pull to refresh"}
        >
          <ArrowDown className={`w-5 h-5 transition-transform ${pullToRefresh.progress >= 100 ? 'rotate-180' : ''}`} />
        </div>
      )}

      <div className="container px-3 py-6 mx-auto max-w-4xl sm:px-4 md:px-6 sm:py-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Stay updated with all your team activities and announcements
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keyboard shortcuts: R (refresh), A (mark all read), S (selection mode)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectionMode && selectedIds.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkMarkAsRead}
                  className="gap-2 touch-manipulation min-h-[44px] sm:min-h-0"
                  aria-label={`Mark ${selectedIds.length} selected notifications as read`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark read ({selectedIds.length})</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="gap-2 touch-manipulation min-h-[44px] sm:min-h-0 text-destructive"
                  aria-label={`Delete ${selectedIds.length} selected notifications`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedIds.length})</span>
                </Button>
              </>
            )}
            {selectionMode ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={selectAll}
                  className="touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={deselectAll}
                  className="touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  Deselect All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {userNotifications.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectionMode(true)}
                    className="gap-2 touch-manipulation min-h-[44px] sm:min-h-0"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Select</span>
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={markAllAsRead}
                    className="gap-2 touch-manipulation min-h-[44px] sm:min-h-0"
                    aria-label="Mark all notifications as read"
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
                  aria-label="Refresh notifications"
                >
                  {loading || pullToRefresh.isRefreshing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Refresh</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <Card className="mb-4 sm:mb-6 border-destructive">
            <CardContent className="p-4 sm:pt-6">
              <p className="text-sm sm:text-base text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Filter Chips - replacing tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:items-center">
          <div className="flex flex-wrap gap-2 flex-1 min-w-0" role="tablist" aria-label="Filter notifications">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
              className="gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0 transition-all text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === "all"}
              aria-controls="notifications-content"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>All</span>
              {categorizedNotifications.all.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 px-1 min-w-[18px] h-4 text-[10px] sm:text-xs">
                  {categorizedNotifications.all.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("unread")}
              className="gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0 transition-all text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === "unread"}
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Unread</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 px-1 min-w-[18px] h-4 text-[10px] sm:text-xs bg-primary text-primary-foreground">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "team" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("team")}
              className="gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0 transition-all text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === "team"}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Team</span>
              {categorizedNotifications.team.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 px-1 min-w-[18px] h-4 text-[10px] sm:text-xs">
                  {categorizedNotifications.team.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("system")}
              className="gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0 transition-all text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === "system"}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>System</span>
              {categorizedNotifications.system.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 px-1 min-w-[18px] h-4 text-[10px] sm:text-xs">
                  {categorizedNotifications.system.length}
                </Badge>
              )}
            </Button>
          </div>
          
          {/* Density View Toggle - Comfortable / Compact / List (expands to fill width) */}
          <div
            className="flex items-stretch flex-1 min-w-0 sm:min-w-[200px] rounded-lg border bg-muted/30 p-0.5"
            role="group"
            aria-label="View density"
          >
            <span className="sr-only">View density:</span>
            <Button
              variant={densityView === "comfortable" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDensityView("comfortable")}
              className="h-8 flex-1 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs touch-manipulation shadow-sm whitespace-nowrap min-w-0"
              aria-label="Comfortable view – more spacing"
              title="Comfortable – more spacing, full details"
            >
              <Square className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="sm:hidden truncate">Comfy</span>
              <span className="hidden sm:inline truncate">Comfortable</span>
            </Button>
            <Button
              variant={densityView === "compact" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDensityView("compact")}
              className="h-8 flex-1 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs touch-manipulation shadow-sm whitespace-nowrap min-w-0"
              aria-label="Compact view – medium density"
              title="Compact – medium spacing"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="truncate">Compact</span>
            </Button>
            <Button
              variant={densityView === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDensityView("list")}
              className="h-8 flex-1 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs touch-manipulation shadow-sm whitespace-nowrap min-w-0"
              aria-label="List view – minimal, dense"
              title="List – minimal, dense list"
            >
              <List className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="truncate">List</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          {/* Tab triggers are replaced by filter chips above - hide default list */}
          <TabsList className="sr-only">
            <span className="sr-only">Filter by category</span>
          </TabsList>

          <TabsContent value="all" className="mt-0" id="notifications-content">
            <NotificationsContent
              notifications={categorizedNotifications.all}
              loading={loading || pageLoading}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onActionComplete={handleActionComplete}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              isMobile={isMobile}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroupExpansion}
              collapsedDateSections={collapsedDateSections}
              onToggleDateSection={toggleDateSection}
              densityView={densityView}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.unread}
              loading={loading || pageLoading}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onActionComplete={handleActionComplete}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              isMobile={isMobile}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroupExpansion}
              collapsedDateSections={collapsedDateSections}
              onToggleDateSection={toggleDateSection}
              densityView={densityView}
            />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.team}
              loading={loading || pageLoading}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onActionComplete={handleActionComplete}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              isMobile={isMobile}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroupExpansion}
              collapsedDateSections={collapsedDateSections}
              onToggleDateSection={toggleDateSection}
              densityView={densityView}
            />
          </TabsContent>

          <TabsContent value="system" className="mt-0">
            <NotificationsContent
              notifications={categorizedNotifications.system}
              loading={loading || pageLoading}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onActionComplete={handleActionComplete}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              isMobile={isMobile}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroupExpansion}
              collapsedDateSections={collapsedDateSections}
              onToggleDateSection={toggleDateSection}
              densityView={densityView}
            />
          </TabsContent>
        </Tabs>

        {/* Floating Quick Actions Toolbar */}
        {selectionMode && selectedIds.length > 0 && (
          <div
            className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:w-auto sm:min-w-[320px] sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200"
            role="toolbar"
            aria-label="Bulk actions toolbar"
          >
            <div className="rounded-xl border border-border bg-background/98 shadow-lg shadow-black/20 backdrop-blur-md overflow-hidden">
              <div className="px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center justify-between gap-3 sm:flex-initial">
                  <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
                    {selectedIds.length} selected
                    {selectedUnreadCount > 0 && selectedUnreadCount < selectedIds.length
                      ? ` · ${selectedUnreadCount} unread`
                      : ""}
                  </Badge>
                  <div className="flex items-center gap-2 sm:hidden">
                    {selectedUnreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleBulkMarkAsRead}
                        className="gap-1.5 h-9 flex-1"
                        aria-label={
                          selectedUnreadCount === selectedIds.length
                            ? "Mark all selected as read"
                            : `Mark ${selectedUnreadCount} unread as read`
                        }
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {selectedUnreadCount === selectedIds.length
                          ? "Mark read"
                          : `Mark ${selectedUnreadCount} read`}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      className="gap-1.5 h-9 flex-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 flex-1 sm:flex-initial">
                  {selectedUnreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleBulkMarkAsRead}
                      className="gap-1.5"
                      aria-label={
                        selectedUnreadCount === selectedIds.length
                          ? "Mark all selected as read"
                          : `Mark ${selectedUnreadCount} unread as read`
                      }
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {selectedUnreadCount === selectedIds.length
                        ? "Mark read"
                        : `Mark ${selectedUnreadCount} read`}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    className="gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
                <div className="pt-2 border-t border-border sm:pt-0 sm:border-t-0 sm:border-l sm:pl-3 sm:ml-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedIds([]);
                    }}
                    className="gap-1.5 w-full sm:w-auto"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
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
  selectionMode = false,
  selectedIds = [],
  onToggleSelection,
  isMobile = false,
  expandedGroups = new Set(),
  onToggleGroup,
  collapsedDateSections = new Set(),
  onToggleDateSection,
  densityView = "comfortable",
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
      <Card className="border-2 border-dashed relative overflow-hidden">
        <CardContent className="flex flex-col justify-center items-center p-8 sm:p-16 relative z-10">
          {/* Enhanced empty state with gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          
          <div className="relative p-4 mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse">
            <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
          </div>
          
          <h3 className="mb-2 text-lg font-bold sm:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            All caught up!
          </h3>
          
          <p className="px-4 max-w-sm text-sm text-center sm:text-base text-muted-foreground mb-6">
            You don&apos;t have any notifications in this category. 
            New notifications will appear here.
          </p>

          {/* Quick action suggestions */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              Browse Teams
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              View Tournaments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort notifications by date (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => {
      const aTime = isGroupedNotification(a) ? new Date(a.latestTimestamp).getTime() : new Date(a.createdAt).getTime();
      const bTime = isGroupedNotification(b) ? new Date(b.latestTimestamp).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    }
  );

  // Separate grouped and regular notifications
  const groupedItems = sortedNotifications.filter(isGroupedNotification);
  const regularNotifications = sortedNotifications.filter(item => !isGroupedNotification(item)) as Notification[];
  
  // Group regular notifications by time periods
  const timeGroups = groupNotificationsByTime(regularNotifications);
  
  // Sort time groups by order
  const sortedTimeGroups = Array.from(timeGroups.entries())
    .sort(([, a], [, b]) => a.order - b.order);

  // Get density-based padding classes
  const getDensityClasses = () => {
    switch (densityView) {
      case "compact":
        return "p-2";
      case "list":
        return "p-1.5";
      default:
        return "p-3";
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Grouped notifications section (if any) */}
      {groupedItems.length > 0 && (
        <div className="transition-all duration-300">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Related Notifications
            </h3>
            <Badge variant="secondary" className="ml-auto">
              {groupedItems.length}
            </Badge>
          </div>
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {groupedItems.map((item) => {
                  const isExpanded = expandedGroups.has(item.id);
                  return (
                    <div key={item.id} className={getDensityClasses()}>
                      <div
                        className={`cursor-pointer rounded-lg ${!item.read ? "bg-gradient-to-r from-accent/40 via-accent/20 to-card shadow-md" : "bg-card"} transition-all duration-200 hover:bg-accent/30 hover:shadow-lg hover:scale-[1.01] p-3`}
                        onClick={() => onToggleGroup?.(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onToggleGroup?.(item.id);
                          }
                        }}
                        aria-expanded={isExpanded}
                        aria-label={`${item.title}. ${item.count} notifications. ${isExpanded ? 'Collapse' : 'Expand'} group`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`rounded-full p-1.5 flex-shrink-0 transition-all ${!item.read ? "bg-primary/10 ring-2 ring-primary/10" : "bg-muted/50"}`}>
                            <Users className={`w-4 h-4 ${!item.read ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`text-sm font-semibold ${!item.read ? "text-foreground" : "text-muted-foreground"}`}>
                                {item.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs shrink-0 animate-pulse">
                                {item.count}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(item.latestTimestamp), { addSuffix: true })}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="bg-muted/20 divide-y divide-border mt-2 rounded-lg animate-in slide-in-from-top-2 fade-in">
                          {item.notifications.map((notification) => (
                            <div key={notification._id} className={`flex items-start gap-2 ${getDensityClasses()}`}>
                              {selectionMode && onToggleSelection && (
                                <div className="flex items-center p-1">
                                  <Checkbox
                                    checked={selectedIds.includes(notification._id)}
                                    onCheckedChange={() => onToggleSelection(notification._id)}
                                    aria-label={`Select notification: ${notification.title}`}
                                    className="touch-manipulation"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <NotificationItem
                                  notification={notification}
                                  onMarkAsRead={onMarkAsRead}
                                  onDelete={onDelete}
                                  onActionComplete={onActionComplete}
                                  densityView={densityView}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time-based sections */}
      {sortedTimeGroups.map(([key, group]) => {
        const isCollapsed = collapsedDateSections.has(key);
        const itemCount = group.items.length;
        
        return (
          <div key={key} className="transition-all duration-300">
            {/* Collapsible Date Section Header */}
            <button
              onClick={() => onToggleDateSection?.(key)}
              className="flex items-center gap-2 px-2 py-2 mb-2 w-full rounded-lg hover:bg-accent/50 transition-colors group"
              aria-expanded={!isCollapsed}
              aria-controls={`section-${key}`}
            >
              <ChevronRight 
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`}
                aria-hidden="true"
              />
              <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-foreground">
                {group.label}
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {itemCount}
              </Badge>
            </button>

            {/* Collapsible Content */}
            {!isCollapsed && (
              <Card 
                id={`section-${key}`}
                className="overflow-hidden border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2"
              >
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {group.items.map((notification) => (
                      <div 
                        key={notification._id} 
                        className="transition-all duration-200"
                      >
                        {selectionMode && onToggleSelection && (
                          <div className="flex items-start gap-2">
                            <div className="flex items-center p-3 pl-4">
                              <Checkbox
                                checked={selectedIds.includes(notification._id)}
                                onCheckedChange={() => onToggleSelection(notification._id)}
                                aria-label={`Select notification: ${notification.title}`}
                                className="touch-manipulation"
                              />
                            </div>
                            <div className="flex-1">
                              <NotificationItem
                                notification={notification}
                                onMarkAsRead={onMarkAsRead}
                                onDelete={onDelete}
                                onActionComplete={onActionComplete}
                                densityView={densityView}
                              />
                            </div>
                          </div>
                        )}
                        {!selectionMode && (
                          <NotificationItem
                            notification={notification}
                            onMarkAsRead={onMarkAsRead}
                            onDelete={onDelete}
                            onActionComplete={onActionComplete}
                            densityView={densityView}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}


      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex flex-col gap-4 items-center mt-6" role="navigation" aria-label="Pagination">
          {isMobile ? (
            // Simplified mobile pagination
            <div className="flex flex-col gap-3 w-full items-center">
              <div className="text-sm text-center text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2 w-full max-w-sm">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="flex-1 touch-manipulation min-h-[44px]"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="mr-1 w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() =>
                    onPageChange(Math.min(pagination.totalPages, currentPage + 1))
                  }
                  disabled={currentPage === pagination.totalPages || loading}
                  className="flex-1 touch-manipulation min-h-[44px]"
                  aria-label="Go to next page"
                >
                  Next
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-center text-muted-foreground">
                {pagination.total} total notifications
              </div>
            </div>
          ) : (
            // Full desktop pagination
            <>
              <div className="flex gap-2 justify-center items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="touch-manipulation min-h-[44px] sm:min-h-0"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="mr-1 w-4 h-4" />
                  Previous
                </Button>

                <div className="flex gap-1 items-center" role="group" aria-label="Page numbers">
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
                          aria-label={`Go to page ${pageNum}`}
                          aria-current={currentPage === pageNum ? "page" : undefined}
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
                  aria-label="Go to next page"
                >
                  Next
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-center text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} •{" "}
                {pagination.total} total notifications
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
