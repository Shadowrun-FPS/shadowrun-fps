import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import { Post } from "@/types/types";
import PostCard from "./post-card";

export async function getFeaturedPosts() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const posts = await db
    .collection("Posts")
    .find({ published: true })
    .sort({ datePublished: -1 })
    .toArray();
  return posts as unknown as Post[];
}

export default async function FeaturedPosts() {
  const posts = await getFeaturedPosts();
  return (
    <section className="max-w-full">
      <h2 className="mb-12 text-3xl font-bold text-center">Latest articles</h2>
      <div className="flex flex-wrap justify-center gap-6 mx-auto mb-16 rounded">
        {posts && posts.length > 0 ? (
          posts.map((post, index) => <PostCard key={index} post={post} />)
        ) : (
          <p className="text-center">No featured posts available.</p>
        )}
      </div>
    </section>
  );
}
