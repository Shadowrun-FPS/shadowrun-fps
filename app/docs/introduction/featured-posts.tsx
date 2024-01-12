import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Post } from "@/types/types";
import PostCard from "./post-card";

export async function getFeaturedPosts() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const posts = await db
    .collection("Posts")
    .find({ isPublished: "yes" })
    .sort({ datePublished: -1 })
    .toArray();
  return posts as unknown as Post[];
}

export default async function FeaturedPosts() {
  const posts = await getFeaturedPosts();
  return (
    <section className="w-auto">
      <h2 className="mb-12 text-3xl font-bold text-center">Latest articles</h2>
      <div className="grid grid-cols-1 gap-6 mx-auto mb-16 rounded lg:grid-cols-2">
        {posts && posts.length > 0 ? (
          posts.map((post, index) => (
            <PostCard
              key={index}
              post={post}
              imageStyle={{ height: 430, width: 650 }}
            />
          ))
        ) : (
          <p className="text-center">No featured posts available.</p>
        )}
      </div>
    </section>
  );
}
