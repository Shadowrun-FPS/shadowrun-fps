import { Post } from "@/types/types";
import PostImage from "./post-image";

type PostProps = {
  post: Post;
};

interface PostImageProps {
  src: string;
  alt: string;
  href: string;
  className?: string;
}

export default function PostCard({ post }: PostProps) {
  return (
    <article className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden">
        <PostImage
          src={post.src}
          alt={post.altText}
          href={post.linkAddress}
          className="transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {post.category}
          </span>
        </div>

        {/* Title and Description */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-sm text-muted-foreground">{post.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>By {post.author}</span>
          <time dateTime={post.datePublished?.toString()}>
            {post.datePublished}
          </time>
        </div>
      </div>
    </article>
  );
}
