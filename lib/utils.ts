import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatRelative } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertMongoId(id: any): string {
  return id?.toString() || id;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM dd, yyyy");
}

// Add a helper function to check if a user is an admin
// Note: This function is client-side safe and only checks for developer ID
// For full role checking, use server-side functions from security-config.ts
export function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  // This is a client-side fallback - server-side should use SECURITY_CONFIG
  return userId === process.env.NEXT_PUBLIC_DEVELOPER_ID || false;
}

// Add a helper function to check if a user is a moderator
// Note: This function is client-side safe and only checks for developer ID
// For full role checking, use server-side functions from security-config.ts
export function isModerator(userId: string | undefined): boolean {
  if (!userId) return false;
  // This is a client-side fallback - server-side should use SECURITY_CONFIG
  return userId === process.env.NEXT_PUBLIC_DEVELOPER_ID || isAdmin(userId);
}

// Add the missing formatTimeAgo function
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
}
