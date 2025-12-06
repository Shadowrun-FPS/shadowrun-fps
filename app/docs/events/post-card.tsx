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
    <article className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <PostImage
          src={post.src}
          alt={post.altText}
          href={post.linkAddress}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Category Badge */}
        {post.category && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {post.category}
            </span>
          </div>
        )}

        {/* Title and Description */}
        <div className="flex-1 space-y-2 mb-4">
          <h2 className="text-lg sm:text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
          {post.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
          {post.author && (
            <span className="truncate">By {post.author}</span>
          )}
          {post.datePublished && (
            <time 
              dateTime={post.datePublished?.toString()}
              className="flex-shrink-0 ml-2"
            >
              {post.datePublished}
            </time>
          )}
        </div>
      </div>
    </article>
  );
}
