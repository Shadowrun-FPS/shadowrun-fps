import { Post } from "@/types/types";
import PostImage from "./post-image";

type PostProps = {
  post: Post;
};

export default function PostCard({ post }: PostProps) {
  return (
    <div className="relative h-64 overflow-hidden transition rounded-md w-96 hover:scale-105">
      <PostImage src={post.src} alt={post.altText} href={post.linkAddress} />

      <div className="absolute bottom-0 left-0 p-4 text-white ">
        <h5 className="mb-2 text-lg font-bold">{post.title}</h5>
        <small>
          Published {post.datePublished}
          {post.description} by {post.author}
        </small>
      </div>
    </div>
  );
}
