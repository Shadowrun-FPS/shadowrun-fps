import type { Notification } from "@/contexts/NotificationsContext";

/**
 * Get color scheme for notification type
 */
export function getNotificationColor(type: string): {
  bg: string;
  border: string;
  icon: string;
  badge: string;
} {
  switch (type) {
    case "team_invite":
      return {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        icon: "text-blue-500",
        badge: "bg-blue-500 text-white",
      };
    case "team_join_request":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        icon: "text-amber-500",
        badge: "bg-amber-500 text-white",
      };
    case "team_member_joined":
    case "queue_match":
      return {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        icon: "text-green-500",
        badge: "bg-green-500 text-white",
      };
    case "team_member_left":
      return {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        icon: "text-orange-500",
        badge: "bg-orange-500 text-white",
      };
    case "moderation":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: "text-red-500",
        badge: "bg-red-500 text-white",
      };
    case "team_captain_transfer":
    case "team_captain":
      return {
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        icon: "text-purple-500",
        badge: "bg-purple-500 text-white",
      };
    default:
      return {
        bg: "bg-primary/10",
        border: "border-primary/30",
        icon: "text-primary",
        badge: "bg-primary text-primary-foreground",
      };
  }
}

/**
 * Generate gradient background for avatars without images
 */
export function getAvatarGradient(name?: string): string {
  if (!name) return "bg-gradient-to-br from-blue-500 to-purple-600";
  
  const gradients = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-teal-600",
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-gradient-to-br from-pink-500 to-purple-600",
    "bg-gradient-to-br from-cyan-500 to-blue-600",
    "bg-gradient-to-br from-yellow-500 to-orange-600",
    "bg-gradient-to-br from-indigo-500 to-purple-600",
    "bg-gradient-to-br from-emerald-500 to-green-600",
  ];
  
  // Use first letter to consistently pick a gradient
  const charCode = name.charCodeAt(0);
  return gradients[charCode % gradients.length];
}

/**
 * Get time-based grouping
 */
export function getTimeGroup(date: Date): {
  key: string;
  label: string;
  order: number;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (itemDate.getTime() === today.getTime()) {
    return { key: "today", label: "Today", order: 0 };
  } else if (itemDate.getTime() === yesterday.getTime()) {
    return { key: "yesterday", label: "Yesterday", order: 1 };
  } else if (itemDate >= thisWeekStart) {
    return { key: "thisWeek", label: "This Week", order: 2 };
  } else if (itemDate >= lastWeekStart) {
    return { key: "lastWeek", label: "Last Week", order: 3 };
  } else if (itemDate >= thisMonthStart) {
    return { key: "thisMonth", label: "This Month", order: 4 };
  } else if (itemDate >= lastMonthStart) {
    return { key: "lastMonth", label: "Last Month", order: 5 };
  } else if (itemDate >= thisYearStart) {
    return { key: "thisYear", label: "Earlier This Year", order: 6 };
  } else {
    return { key: "older", label: "Older", order: 7 };
  }
}

/**
 * Group notifications by time periods
 */
export function groupNotificationsByTime(
  notifications: Notification[]
): Map<string, { label: string; order: number; items: Notification[] }> {
  const groups = new Map<string, { label: string; order: number; items: Notification[] }>();
  
  for (const notification of notifications) {
    const { key, label, order } = getTimeGroup(new Date(notification.createdAt));
    
    if (!groups.has(key)) {
      groups.set(key, { label, order, items: [] });
    }
    
    groups.get(key)!.items.push(notification);
  }
  
  return groups;
}

/**
 * Get notification metadata for display
 */
export function getNotificationMetadata(notification: Notification): {
  icon: string;
  label: string;
  value: string;
}[] {
  const metadata: { icon: string; label: string; value: string }[] = [];
  
  if (notification.metadata?.teamSize) {
    const size = notification.metadata.teamSize;
    metadata.push({
      icon: "👥",
      label: "Team Size",
      value: `${size}v${size}`,
    });
  }
  
  if (notification.metadata?.teamName) {
    metadata.push({
      icon: "🏷️",
      label: "Team",
      value: notification.metadata.teamName,
    });
  }
  
  if (notification.metadata?.userName) {
    metadata.push({
      icon: "👤",
      label: "User",
      value: notification.metadata.userName,
    });
  }
  
  return metadata;
}
