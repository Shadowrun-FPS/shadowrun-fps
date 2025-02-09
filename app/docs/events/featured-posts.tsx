import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Post } from "@/types/types";
import PostCard from "./post-card";

function formatDate(dateStr: string) {
  const [month, day, year] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function getFeaturedPosts() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const posts = await db
    .collection("Posts")
    .find({ published: true })
    .toArray();

  // Sort by date manually since we have string dates
  posts.sort((a, b) => {
    const [monthA, dayA, yearA] = a.datePublished.split("-").map(Number);
    const [monthB, dayB, yearB] = b.datePublished.split("-").map(Number);

    // Create Date objects for comparison
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);

    return dateB.getTime() - dateA.getTime(); // Newest first
  });

  // Format the dates for display
  return posts.map((post) => ({
    ...post,
    datePublished: formatDate(post.datePublished),
  })) as unknown as Post[];
}

export default async function FeaturedPosts() {
  const posts = await getFeaturedPosts();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts && posts.length > 0 ? (
          posts.map((post, index) => (
            <div
              key={index}
              className="animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-muted-foreground">
              No featured posts available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
