"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PostCard } from "@/components/posts/post-card";
import { PostReadSheet } from "@/components/posts/post-read-sheet";
import {
  POST_FILTER_PARAM,
  POST_TYPE_META,
  countPostsByType,
  filterPosts,
  getEmptyPostsMessage,
  getPostFilterParam,
  parsePostFilter,
} from "@/lib/post-display";
import { isUpcomingPost } from "@/lib/post-date";
import { cn } from "@/lib/utils";
import { POST_TYPES, type Post, type PostTypeFilter } from "@/types";

interface PostArchiveViewProps {
  posts: Post[];
  filter: PostTypeFilter;
  onFilterChange: (filter: PostTypeFilter) => void;
}

const FILTER_OPTIONS: PostTypeFilter[] = ["all", ...POST_TYPES];

/** Fewest posts that still get a featured lead card above the grid. */
const LEAD_MIN_POSTS = 3;

function getFilterLabel(filter: PostTypeFilter) {
  return filter === "all" ? "All" : POST_TYPE_META[filter].pluralLabel;
}

/** Filter chips, lead card, and grid. Rendered on the server for the unfiltered list. */
export function PostArchiveView({
  posts,
  filter,
  onFilterChange,
}: PostArchiveViewProps) {
  const [openPost, setOpenPost] = useState<Post | null>(null);
  // Resolved after mount so server and browser agree on the first render.
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const counts = useMemo(() => countPostsByType(posts), [posts]);
  const visiblePosts = useMemo(() => filterPosts(posts, filter), [posts, filter]);
  // A lead card needs enough posts below it. With fewer, show the plain grid.
  const hasLead = visiblePosts.length >= LEAD_MIN_POSTS;
  const leadPost = hasLead ? visiblePosts[0] : undefined;
  const gridPosts = hasLead ? visiblePosts.slice(1) : visiblePosts;

  const handleSheetOpenChange = useCallback((open: boolean) => {
    if (!open) setOpenPost(null);
  }, []);

  const isUpcoming = (post: Post) =>
    today !== null && isUpcomingPost(post, today);

  const emptyMessage = getEmptyPostsMessage(filter);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter posts by type"
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = option === filter;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {getFilterLabel(option)}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  isActive ? "bg-primary-foreground/20" : "bg-muted"
                )}
              >
                {counts[option]}
              </span>
            </button>
          );
        })}
      </div>

      {visiblePosts.length > 0 ? (
        <div className="space-y-6 sm:space-y-8">
          {leadPost ? (
            <PostCard
              key={leadPost._id}
              post={leadPost}
              variant="lead"
              priority
              upcoming={isUpcoming(leadPost)}
              onOpen={setOpenPost}
            />
          ) : null}
          <div className="grid grid-cols-1 gap-6 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {gridPosts.map((post, index) => (
              <PostCard
                key={post._id}
                post={post}
                // Without a lead card, the first grid card is the one above the fold.
                priority={!hasLead && index === 0}
                upcoming={isUpcoming(post)}
                onOpen={setOpenPost}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 bg-muted/30 py-12 text-center sm:py-16">
          <p className="mb-2 text-base text-muted-foreground sm:text-lg">
            {emptyMessage.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {emptyMessage.description}
          </p>
        </div>
      )}

      <PostReadSheet post={openPost} onOpenChange={handleSheetOpenChange} />
    </div>
  );
}

interface PostArchiveProps {
  posts: Post[];
}

/** Keeps the active filter in the URL (`/events?type=news`). */
export function PostArchive({ posts }: PostArchiveProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parsePostFilter(searchParams.get(POST_FILTER_PARAM));

  const handleFilterChange = useCallback(
    (nextFilter: PostTypeFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      const value = getPostFilterParam(nextFilter);
      if (value) {
        params.set(POST_FILTER_PARAM, value);
      } else {
        params.delete(POST_FILTER_PARAM);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <PostArchiveView
      posts={posts}
      filter={filter}
      onFilterChange={handleFilterChange}
    />
  );
}
