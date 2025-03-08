import { formatDistanceToNow, format } from "date-fns";

export function formatTimeAgo(date: Date | string) {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function formatDate(date: Date | string) {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return format(parsedDate, "MMMM dd, yyyy");
}
