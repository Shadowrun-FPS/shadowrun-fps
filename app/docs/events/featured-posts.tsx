"use client";

import { PostCard } from "@/components/posts/post-card";
import React, { useEffect, useState } from "react";

// Define the Post interface to match your data structure
interface Post {
  _id: string;
  title: string;
  content?: string;
  description?: string;
  imageUrl?: string;
  slug?: string;
  type?: string;
  date?: string;
  author?: string;
  createdAt?: string;
  // Add any other properties your posts have
}

export default function FeaturedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const baseUrl = window.location.origin;
        const res = await fetch(`${baseUrl}/api/posts`);

        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg h-[400px] sm:h-[450px] bg-muted/50 animate-pulse border-2 border-border"
          >
            <div className="h-48 sm:h-56 bg-muted animate-pulse" />
            <div className="p-4 sm:p-5 space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 sm:py-16 text-center">
        <p className="text-base sm:text-lg text-destructive font-medium">
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts && posts.length > 0 ? (
        posts.map((post) => <PostCard key={post._id} post={post} />)
      ) : (
        <div className="py-12 sm:py-16 text-center col-span-full">
          <p className="text-base sm:text-lg text-muted-foreground">
            No posts available.
          </p>
        </div>
      )}
    </div>
  );
}
