"use client";

import { PlusCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { PostArchive, PostArchiveView } from "@/components/posts/post-archive";
import { Button } from "@/components/ui/button";
import type { UserPermissions } from "@/lib/client-config";
import type { Post } from "@/types";

// Admin dialogs only load when an admin opens them.
const PostDialog = dynamic(
  () => import("@/components/posts/post-dialog").then((mod) => mod.PostDialog),
  { ssr: false }
);
const PostManager = dynamic(
  () =>
    import("@/components/posts/post-manager").then((mod) => mod.PostManager),
  { ssr: false }
);

interface EventsClientProps {
  /** Posts loaded on the server. Null when the server could not reach the database. */
  initialPosts: Post[] | null;
}

function noop() {}

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
      {[1, 2, 3].map((placeholder) => (
        <div key={placeholder} className="flex flex-col">
          <div className="h-48 animate-pulse rounded-xl bg-muted/50 sm:h-56 sm:rounded-2xl" />
          <div className="space-y-2 pt-3 sm:pt-4">
            <div className="h-6 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Loads the list in the browser when the server render had no posts to hand over. */
function useFallbackPosts(initialPosts: Post[] | null) {
  const [fetchedPosts, setFetchedPosts] = useState<Post[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (initialPosts !== null) return;

    let isCancelled = false;
    fetch("/api/posts", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch posts");
        return response.json() as Promise<Post[]>;
      })
      .then((posts) => {
        if (!isCancelled) setFetchedPosts(posts);
      })
      .catch(() => {
        if (!isCancelled) setHasError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [initialPosts]);

  return { posts: initialPosts ?? fetchedPosts, hasError };
}

export default function EventsClient({ initialPosts }: EventsClientProps) {
  const { data: session } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const { posts, hasError } = useFallbackPosts(initialPosts);

  useEffect(() => {
    if (!session?.user) {
      setUserPermissions(null);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const { deduplicatedFetch } = await import(
          "@/lib/request-deduplication"
        );
        const userData = await deduplicatedFetch<{
          permissions: UserPermissions;
        }>("/api/user/data", {
          ttl: 60000,
        });
        setUserPermissions(userData.permissions);
      } catch {
        setUserPermissions(null);
      }
    };

    void fetchPermissions();
  }, [session]);

  const isAdmin = userPermissions?.isAdmin || false;

  return (
    <article className="space-y-6 sm:space-y-8">
      <section className="space-y-3 sm:space-y-4">
        <p className="text-base text-muted-foreground sm:text-lg md:text-xl">
          Stay connected with the latest Shadowrun FPS community events, LAN
          parties, and community updates.
        </p>

        {isAdmin && (
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create Post
            </Button>
            <Button variant="outline" onClick={() => setIsManagerOpen(true)}>
              Manage Posts
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Community Events &amp; News
        </h2>

        {posts ? (
          <Suspense
            fallback={
              <PostArchiveView posts={posts} filter="all" onFilterChange={noop} />
            }
          >
            <PostArchive posts={posts} />
          </Suspense>
        ) : hasError ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 py-12 text-center sm:py-16">
            <p className="mb-2 text-base font-medium text-destructive sm:text-lg">
              Error loading posts
            </p>
            <p className="text-sm text-muted-foreground">
              Refresh the page to try again.
            </p>
          </div>
        ) : (
          <PostsSkeleton />
        )}
      </section>

      {isDialogOpen && (
        <PostDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      )}

      {isManagerOpen && (
        <PostManager
          open={isManagerOpen}
          onOpenChange={setIsManagerOpen}
          canManagePosts={isAdmin}
        />
      )}
    </article>
  );
}
