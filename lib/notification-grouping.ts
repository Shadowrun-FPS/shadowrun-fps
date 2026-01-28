import type { Notification } from "@/contexts/NotificationsContext";

export interface GroupedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  count: number;
  notifications: Notification[];
  latestTimestamp: string;
  read: boolean; // true if all notifications in group are read
}

/**
 * Groups related notifications together
 * Example: Multiple team invites from same team or multiple join requests
 */
export function groupNotifications(
  notifications: Notification[],
  enableGrouping = true
): (Notification | GroupedNotification)[] {
  if (!enableGrouping || notifications.length === 0) {
    return notifications;
  }

  const groups = new Map<string, Notification[]>();
  const ungrouped: Notification[] = [];

  // Sort by timestamp first (newest first)
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const notification of sorted) {
    // Group team join requests by team
    if (notification.type === "team_join_request") {
      const teamId = notification.metadata?.teamId;
      if (teamId) {
        const key = `team_join_request_${teamId}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(notification);
        continue;
      }
    }

    // Group team member joined/left by team (within 24 hours)
    if (
      notification.type === "team_member_joined" ||
      notification.type === "team_member_left"
    ) {
      const teamId = notification.metadata?.teamId;
      if (teamId) {
        const key = `${notification.type}_${teamId}`;
        const existing = groups.get(key);
        
        // Only group if within 24 hours of first notification
        if (existing && existing.length > 0) {
          const firstTimestamp = new Date(existing[0].createdAt).getTime();
          const currentTimestamp = new Date(notification.createdAt).getTime();
          const hoursDiff = (firstTimestamp - currentTimestamp) / (1000 * 60 * 60);
          
          if (hoursDiff <= 24) {
            existing.push(notification);
            continue;
          }
        } else if (!existing) {
          groups.set(key, [notification]);
          continue;
        }
      }
    }

    // Group moderation notifications (within 1 hour)
    if (notification.type === "moderation") {
      const key = `moderation_${notification.userId}`;
      const existing = groups.get(key);
      
      if (existing && existing.length > 0) {
        const firstTimestamp = new Date(existing[0].createdAt).getTime();
        const currentTimestamp = new Date(notification.createdAt).getTime();
        const minutesDiff = (firstTimestamp - currentTimestamp) / (1000 * 60);
        
        if (minutesDiff <= 60) {
          existing.push(notification);
          continue;
        }
      } else if (!existing) {
        groups.set(key, [notification]);
        continue;
      }
    }

    // Don't group single notifications or actionable notifications
    ungrouped.push(notification);
  }

  // Convert groups to GroupedNotification objects
  const result: (Notification | GroupedNotification)[] = [];

  for (const [key, notifs] of Array.from(groups.entries())) {
    // Only group if there are 2+ notifications
    if (notifs.length >= 2) {
      const allRead = notifs.every((n) => n.read);
      const latestNotification = notifs[0]; // Already sorted by timestamp

      let groupTitle = "";
      let groupMessage = "";

      // Create group title based on type
      if (key.startsWith("team_join_request_")) {
        groupTitle = `${notifs.length} join requests for ${latestNotification.metadata?.teamName || "your team"}`;
        groupMessage = `${notifs.length} players want to join your team`;
      } else if (key.startsWith("team_member_joined_")) {
        groupTitle = `${notifs.length} new members joined ${latestNotification.metadata?.teamName || "your team"}`;
        groupMessage = notifs.map((n) => n.metadata?.userName).filter(Boolean).join(", ");
      } else if (key.startsWith("team_member_left_")) {
        groupTitle = `${notifs.length} members left ${latestNotification.metadata?.teamName || "your team"}`;
        groupMessage = notifs.map((n) => n.metadata?.userName).filter(Boolean).join(", ");
      } else if (key.startsWith("moderation_")) {
        groupTitle = `${notifs.length} moderation actions`;
        groupMessage = "Multiple moderation actions have been taken on your account";
      } else {
        groupTitle = `${notifs.length} notifications`;
        groupMessage = latestNotification.message;
      }

      result.push({
        id: key,
        type: latestNotification.type,
        title: groupTitle,
        message: groupMessage,
        count: notifs.length,
        notifications: notifs,
        latestTimestamp: latestNotification.createdAt,
        read: allRead,
      });
    } else {
      // Single notification in group, add as ungrouped
      ungrouped.push(...notifs);
    }
  }

  // Add ungrouped notifications
  result.push(...ungrouped);

  // Sort final result by timestamp
  return result.sort((a, b) => {
    const aTime =
      "latestTimestamp" in a
        ? new Date(a.latestTimestamp).getTime()
        : new Date(a.createdAt).getTime();
    const bTime =
      "latestTimestamp" in b
        ? new Date(b.latestTimestamp).getTime()
        : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

/**
 * Check if an item is a grouped notification
 */
export function isGroupedNotification(
  item: Notification | GroupedNotification
): item is GroupedNotification {
  return "count" in item && "notifications" in item;
}
