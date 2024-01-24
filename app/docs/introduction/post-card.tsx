import { Post } from "@/types/types";
import PostImage from "./post-image";

type PostProps = {
  post: Post;
};

export default function PostCard({ post }: PostProps) {
  return (
    <section>
      <div className="relative mb-4 overflow-hidden transition rounded-md h-72 sm:w-96 hover:scale-105">
        <PostImage src={post.src} alt={post.altText} href={post.linkAddress} />

        <div className="absolute text-white "></div>
      </div>
      <h5 className="mb-2 text-lg font-bold">{post.title}</h5>
      <small>
        Published {post.datePublished}
        {post.description} by {post.author}
      </small>
    </section>
  );
}
