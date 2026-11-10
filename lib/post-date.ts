import { format } from "date-fns";
import type { Post } from "@/types";

const CALENDAR_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_DAY_YEAR_PATTERN = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;

/** Reads a stored post date. Calendar days (`YYYY-MM-DD`) resolve to local midnight of that day. */
export function parsePostDate(value: unknown): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value !== "string") return undefined;

  const calendarMatch = value.match(CALENDAR_DAY_PATTERN);
  if (calendarMatch) {
    const [, year, month, day] = calendarMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const monthDayYearMatch = value.match(MONTH_DAY_YEAR_PATTERN);
  if (monthDayYearMatch) {
    const [, month, day, year] = monthDayYearMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

/** Calendar day (`YYYY-MM-DD`) of a local date. The composer sends this instead of a UTC timestamp. */
export function toCalendarDay(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function getPostDateValue(post: Pick<Post, "datePublished" | "date">) {
  return post.datePublished || post.date;
}

export function getPostDate(
  post: Pick<Post, "datePublished" | "date">
): Date | undefined {
  return parsePostDate(getPostDateValue(post));
}

export function formatPostDate(
  post: Pick<Post, "datePublished" | "date">,
  pattern = "MMM d, yyyy"
): string {
  const date = getPostDate(post);
  return date ? format(date, pattern) : "No date";
}

/** True while the post's calendar day is today or later. */
export function isUpcomingPost(
  post: Pick<Post, "datePublished" | "date" | "type">,
  now: Date = new Date()
): boolean {
  if (post.type !== "EVENT") return false;
  const date = getPostDate(post);
  if (!date) return false;
  return toCalendarDay(date) >= toCalendarDay(now);
}
