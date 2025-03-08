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
export function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  return userId === "238329746671271936"; // Your Discord ID
}

// Add a helper function to check if a user is a moderator
export function isModerator(userId: string | undefined): boolean {
  if (!userId) return false;
  return userId === "238329746671271936" || isAdmin(userId); // Your Discord ID
}
