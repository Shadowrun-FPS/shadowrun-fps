"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { PostDialog } from "@/components/posts/post-dialog";
import { PostManager } from "@/components/posts/post-manager";
import dynamic from "next/dynamic";

// Import FeaturedPosts with suspense
const FeaturedPosts = dynamic(() => import("./featured-posts"), {
  ssr: true,
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

  // Check if user is admin or developer
  const isAdmin =
    session?.user?.id === process.env.NEXT_PUBLIC_DEVELOPER_ID ||
    session?.user?.id === "238329746671271936" || // Your Discord ID
    session?.user?.roles?.some(
      (role) =>
        role === "932585751332421642" || // Admin
        role === "1095126043918082109" // Founder
    );

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative py-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background" />
        </div>
        <div className="relative max-w-4xl px-4 mx-auto text-center">
          <h1 className="mb-6 text-4xl font-bold sm:text-5xl lg:text-6xl">
            Community Events
          </h1>
          <p className="text-xl text-muted-foreground">
            Stay connected with the latest Shadowrun FPS community events and
            updates
          </p>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex justify-center gap-4 mt-8">
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
        </div>
      </section>

      {/* Featured Posts Grid */}
      <section className="relative px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-background/80" />
        <div className="relative">
          <Suspense
            fallback={
              <div className="flex items-center justify-center w-full h-96">
                Loading posts...
              </div>
            }
          >
            <FeaturedPosts />
          </Suspense>
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
    </div>
  );
}
