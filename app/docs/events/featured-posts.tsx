import { PostCard } from "@/components/posts/post-card";
import React from "react";

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

// Remove async/await from the component
export default function FeaturedPosts() {
  // Use React's useEffect for client-side data fetching
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-md h-96 bg-muted animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts && posts.length > 0 ? (
        posts.map((post) => <PostCard key={post._id} post={post} />)
      ) : (
        <div className="py-12 text-center col-span-full">
          <p className="text-lg text-muted-foreground">No posts available.</p>
        </div>
      )}
    </div>
  );
}
