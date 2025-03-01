import { format } from "date-fns";
import { formatDistance } from "date-fns/formatDistance";

export function formatDate(timestamp: number) {
  try {
    return format(new Date(timestamp), "MMM dd, yyyy, h:mm a");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

export function formatCalendarDate(date: Date) {
  return format(date, "PPP");
}

export function formatDistanceToNow(date: Date) {
  return formatDistance(date, new Date(), { addSuffix: true });
}

// Add back formatJoinTime for queue page compatibility
export function formatJoinTime(timestamp: number) {
  try {
    return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
  } catch (error) {
    console.error("Join time formatting error:", error);
    return "Unknown time";
  }
}
