"use client";

import { PostCoverImage } from "@/components/posts/post-cover-image";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPostDate } from "@/lib/post-date";
import type { Post } from "@/types";

interface PostReadSheetProps {
  post: Post | null;
  onOpenChange: (open: boolean) => void;
}

/** Full post for cards that have no external link. */
export function PostReadSheet({ post, onOpenChange }: PostReadSheetProps) {
  return (
    <Sheet open={post !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-xl"
      >
        {post ? (
          <article>
            <div className="relative aspect-video w-full bg-muted">
              <PostCoverImage
                imageUrl={post.imageUrl}
                alt={post.title}
                sizes="(max-width: 640px) 100vw, 36rem"
              />
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              <SheetHeader className="space-y-3 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <PostTypeBadge type={post.type} />
                  <span
                    className="text-sm text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {formatPostDate(post, "MMMM d, yyyy")}
                  </span>
                </div>
                <SheetTitle className="text-2xl font-bold leading-tight">
                  {post.title}
                </SheetTitle>
                <SheetDescription>By {post.author}</SheetDescription>
              </SheetHeader>
              {post.description ? (
                <p className="whitespace-pre-line break-words text-base leading-relaxed text-foreground/90">
                  {post.description}
                </p>
              ) : null}
            </div>
          </article>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
