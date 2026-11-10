import type { Post, PostType, PostTypeFilter } from "@/types";
import { POST_TYPES } from "@/types";

interface PostTypeMeta {
  label: string;
  pluralLabel: string;
  /** Badge colors from the global brand tokens. */
  badgeClassName: string;
}

export const POST_TYPE_META: Record<PostType, PostTypeMeta> = {
  EVENT: {
    label: "Event",
    pluralLabel: "Events",
    badgeClassName: "bg-primary text-primary-foreground",
  },
  NEWS: {
    label: "News",
    pluralLabel: "News",
    badgeClassName: "bg-secondary text-secondary-foreground",
  },
};

export const POST_FILTER_PARAM = "type";

const FILTER_PARAM_BY_TYPE: Record<PostType, string> = {
  EVENT: "events",
  NEWS: "news",
};

const TYPE_BY_FILTER_PARAM: Record<string, PostType> = {
  ...(Object.fromEntries(
    POST_TYPES.map((type) => [FILTER_PARAM_BY_TYPE[type], type])
  ) as Record<string, PostType>),
  // Old shared links to the retired Articles filter land on News.
  articles: "NEWS",
};

/** Maps any stored or submitted type to a current one. Retired and unknown types become News. */
export function normalizePostType(value: unknown): PostType {
  return POST_TYPES.includes(value as PostType) ? (value as PostType) : "NEWS";
}

/** Reads `?type=` from the URL. Unknown values fall back to All. */
export function parsePostFilter(value: string | null | undefined): PostTypeFilter {
  if (!value) return "all";
  return TYPE_BY_FILTER_PARAM[value.toLowerCase()] ?? "all";
}

/** URL value for a filter, or null when the filter is All. */
export function getPostFilterParam(filter: PostTypeFilter): string | null {
  return filter === "all" ? null : FILTER_PARAM_BY_TYPE[filter];
}

export function filterPosts(posts: Post[], filter: PostTypeFilter): Post[] {
  return filter === "all" ? posts : posts.filter((post) => post.type === filter);
}

export function countPostsByType(posts: Post[]): Record<PostTypeFilter, number> {
  const counts: Record<PostTypeFilter, number> = {
    all: posts.length,
    EVENT: 0,
    NEWS: 0,
  };
  for (const post of posts) {
    if (post.type in counts) counts[post.type] += 1;
  }
  return counts;
}

export function getEmptyPostsMessage(filter: PostTypeFilter): {
  title: string;
  description: string;
} {
  switch (filter) {
    case "EVENT":
      return {
        title: "No events yet",
        description: "Check back soon for upcoming community events.",
      };
    case "NEWS":
      return {
        title: "No news yet",
        description: "Announcements will appear here as they are posted.",
      };
    default:
      return {
        title: "Nothing posted yet",
        description:
          "Check back soon for community events, news, and announcements.",
      };
  }
}

/** Host that serves uploaded post images through the Next.js image optimizer. */
const OPTIMIZED_MEDIA_HOST = process.env.NEXT_PUBLIC_POST_MEDIA_HOST ?? "";

function isRemoteUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Local paths start with `/`. Bare paths gain one. */
export function normalizeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (isRemoteUrl(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

/** Remote images skip the optimizer unless their host is in `images.remotePatterns`. */
export function shouldSkipImageOptimization(url: string): boolean {
  if (!isRemoteUrl(url)) return false;
  if (!OPTIMIZED_MEDIA_HOST) return true;
  try {
    return new URL(url).hostname !== OPTIMIZED_MEDIA_HOST;
  } catch {
    return true;
  }
}
