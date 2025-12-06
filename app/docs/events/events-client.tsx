"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PostDialog } from "@/components/posts/post-dialog";
import { PostManager } from "@/components/posts/post-manager";
import { UserPermissions } from "@/lib/client-config";
import dynamic from "next/dynamic";

// Import FeaturedPosts with client-side only rendering
const FeaturedPosts = dynamic(() => import("./featured-posts"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-96">
      Loading posts...
    </div>
  ),
});

export default function EventsClient() {
  const { data: session } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);

  // Add useEffect to handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/permissions");
          if (response.ok) {
            const permissions = await response.json();
            setUserPermissions(permissions);
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
        }
      }
    };

    fetchPermissions();
  }, [session]);

  // Check if user is admin
  const isAdmin = userPermissions?.isAdmin || false;

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return (
      <article className="space-y-6 sm:space-y-8">
        <section className="space-y-3 sm:space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-full" />
        </section>
        <section className="space-y-3 sm:space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg h-[400px] sm:h-[450px] bg-muted/50 animate-pulse border-2 border-border"
              />
            ))}
          </div>
        </section>
      </article>
    );
  }

  return (
    <article className="space-y-6 sm:space-y-8">
      {/* Introduction Section */}
      <section className="space-y-3 sm:space-y-4">
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
          Stay connected with the latest Shadowrun FPS community events, tournaments, LAN parties, and community updates.
        </p>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Create Post
            </Button>
            <Button variant="outline" onClick={() => setIsManagerOpen(true)}>
              Manage Posts
            </Button>
          </div>
        )}
      </section>

      {/* Featured Posts Grid */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Upcoming Events
          </h2>
        </div>
        <div className="relative">
          <FeaturedPosts />
        </div>
      </section>

      {/* Post Creation Dialog */}
      {isDialogOpen && (
        <PostDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      )}

      {/* Post Manager Dialog */}
      {isManagerOpen && (
        <PostManager open={isManagerOpen} onOpenChange={setIsManagerOpen} />
      )}
    </article>
  );
}
