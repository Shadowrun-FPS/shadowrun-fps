import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import Link from "next/link";

export type Post = {
  title: string;
  src: string;
  description: string;
  isTutorial: string;
  author: string;
  datePublished: string;
  linkAddress: string;
  altText: string;
};

export async function getFeaturedPosts() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const posts = await db
    .collection("Posts")
    .find({ isPublished: "yes" })
    .toArray();
  return posts as unknown as Post[];
}

export default async function FeaturedPosts() {
  const posts = await getFeaturedPosts();
  const imageWidth = 650;
  const imageHeight = 430;
  return (
    <section>
      <h2 className="mb-12 text-3xl font-bold text-center">Latest articles</h2>
      <div className="grid grid-cols-1 gap-6 mx-auto mb-16 rounded lg:grid-cols-2">
        {posts && posts.length > 0 ? (
          posts.map((post, index) => (
            <section key={index} className="relative group hover:scale-105">
              <div className="relative overflow-hidden transition rounded-md ">
                {post.linkAddress ? (
                  <a href={post.linkAddress} target="_blank">
                    <Image
                      src={post.src}
                      alt={post.altText}
                      width={imageWidth}
                      height={imageHeight}
                      style={{ height: `${imageHeight}px` }}
                    />
                  </a>
                ) : (
                  <Image
                    src={post.src}
                    alt={post.altText}
                    width={imageWidth}
                    height={imageHeight}
                    style={{ height: `${imageHeight}px` }}
                  />
                )}
              </div>

              <div className="absolute bottom-0 left-0 p-4 text-white ">
                <h5 className="mb-2 text-lg font-bold">{post.title}</h5>
                <small>
                  Published {post.datePublished}
                  {post.description} by {post.author}
                </small>
              </div>
            </section>
          ))
        ) : (
          <p className="text-center">No featured posts available.</p>
        )}
      </div>
    </section>
  );
}
