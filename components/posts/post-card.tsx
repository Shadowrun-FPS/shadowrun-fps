"use client";

import { ExternalLink } from "lucide-react";
import { memo } from "react";
import { PostCoverImage } from "@/components/posts/post-cover-image";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { formatPostDate } from "@/lib/post-date";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";

export type PostCardVariant = "grid" | "lead";

interface PostCardProps {
  post: Post;
  variant?: PostCardVariant;
  /** True while an event's calendar day is today or later. */
  upcoming?: boolean;
  /** Load the cover immediately (the lead card is above the fold). */
  priority?: boolean;
  /** Opens the read sheet for posts without an external link. */
  onOpen: (post: Post) => void;
}

const titleLinkClassName =
  "text-left after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background";

function PostCardComponent({
  post,
  variant = "grid",
  upcoming = false,
  priority = false,
  onOpen,
}: PostCardProps) {
  const isLead = variant === "lead";
  const hasLink = Boolean(post.link);
  const title = post.title || "Untitled";

  const titleClassName = cn(
    titleLinkClassName,
    "font-bold leading-tight text-foreground transition-colors group-hover:text-primary",
    isLead
      ? "text-xl sm:text-2xl lg:text-3xl line-clamp-3"
      : "text-lg sm:text-xl line-clamp-2"
  );

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col",
        isLead && "sm:flex-row sm:items-center sm:gap-6 lg:gap-8"
      )}
    >
      {/* Every cover is 16:9, so one upload size crops the same way in both layouts. */}
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl",
          isLead && "sm:w-1/2 sm:shrink-0"
        )}
      >
        <PostCoverImage
          imageUrl={post.imageUrl}
          alt={post.title}
          priority={priority}
          sizes={
            isLead
              ? "(max-width: 640px) 100vw, 50vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* One row so the badges and date wrap together instead of overlapping on narrow covers. */}
        <div className="absolute inset-x-2.5 top-2.5 z-10 flex flex-wrap items-start justify-between gap-1.5 sm:inset-x-3 sm:top-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <PostTypeBadge type={post.type} />
            {upcoming ? (
              <span className="inline-block rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm sm:text-xs">
                Upcoming
              </span>
            ) : null}
          </div>
          <span
            className="inline-block rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm sm:text-xs"
            suppressHydrationWarning
          >
            {formatPostDate(post)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-grow flex-col space-y-2 pt-4 sm:pt-5",
          isLead && "sm:basis-0 sm:pt-0"
        )}
      >
        <h3>
          {hasLink ? (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className={titleClassName}
            >
              {title}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onOpen(post)}
              className={titleClassName}
            >
              {title}
            </button>
          )}
        </h3>

        {post.description ? (
          <p
            className={cn(
              "whitespace-pre-line leading-relaxed text-muted-foreground",
              isLead
                ? "text-base line-clamp-4 sm:line-clamp-6"
                : "text-sm sm:text-base line-clamp-3"
            )}
          >
            {post.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground sm:text-sm">
          <span className="min-w-0 truncate font-medium">By {post.author}</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-primary">
            {hasLink ? (
              <>
                Open link
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            ) : (
              "Read more"
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

export const PostCard = memo(PostCardComponent);
