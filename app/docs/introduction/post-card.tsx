import { Post } from "@/types/types";
import PostImage from "./post-image";

type PostProps = {
  post: Post;
};

export default function PostCard({ post }: PostProps) {
  return (
    <section className="w-96">
      <div className="mb-4">
        <div className="relative mb-2 overflow-hidden transition rounded-md h-72 hover:scale-105">
          <PostImage
            src={post.src}
            alt={post.altText}
            href={post.linkAddress}
          />
        </div>
        <div className="flex flex-col justify-between mx-2">
          <div>
            <h5 className="mb-2 text-lg font-bold">{post.title}</h5>
            <p className="overflow-hidden text-sm leading-snug max-h-20">
              {post.description}
            </p>
          </div>
          <div className="text-right">
            <small>
              Published {post.datePublished} by {post.author}
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
