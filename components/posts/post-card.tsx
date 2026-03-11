"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

// Update the Post interface to include all properties used in the component
interface Post {
  _id: string;
  title: string;
  content?: string;
  description?: string;
  imageUrl?: string;
  image?: string;
  thumbnail?: string;
  featuredImage?: string;
  slug?: string;
  type?: string;
  date?: string;
  eventDate?: string;
  datePublished?: string;
  author?: string;
  authorNickname?: string;
  creator?: string;
  createdAt?: string;
  publishedAt?: string;
  excerpt?: string;
  summary?: string;
  link?: string;
  url?: string;
  externalLink?: string;
  href?: string;
}

export function PostCard({ post }: { post: Post }) {
  const [imageError, setImageError] = useState(false);

  // Format date safely - check multiple possible date field names
  const formatDate = () => {
    // Prioritize datePublished over date field
    // Check various possible date fields in order of preference
    const dateValue = post.datePublished || post.date || post.createdAt || post.publishedAt;

    if (!dateValue) return "No date";

    try {
      let date: Date;
      
      // Check if it's already a Date object using Object.prototype.toString
      if (dateValue && typeof dateValue === "object" && Object.prototype.toString.call(dateValue) === "[object Date]") {
        // Already a Date object
        date = dateValue as Date;
      } else if (typeof dateValue === "string") {
        // Handle different string formats
        // Check if it's in MM-DD-YYYY format (e.g., "10-17-2023")
        const mmddyyyyMatch = dateValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (mmddyyyyMatch) {
          const [, month, day, year] = mmddyyyyMatch;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Try standard Date parsing (ISO, etc.)
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue as string | number);
      }

      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Update the getImageUrl function to ensure it always returns a string
  // Normalize local image URLs to start with / if they don't already
  const getImageUrl = () => {
    const url = post.imageUrl || post.image || post.thumbnail || post.featuredImage || "";
    if (!url) return "";
    
    // If it's already an external URL, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    
    // If it's a local path and doesn't start with /, add it
    if (url && !url.startsWith("/")) {
      return `/${url}`;
    }
    
    return url;
  };

  // Update the getLink function to not return a fallback "#"
  const getLink = () => {
    return post.link || post.url || post.externalLink || post.href || "";
  };

  // Now hasLink will only be true if there's an actual link
  const hasLink = Boolean(getLink());
  const hasImage = !!getImageUrl() && !imageError;

  const title = post.title || "Untitled";
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (hasLink) {
      return (
        <Link
          href={getLink()}
          target="_blank"
          rel="noopener noreferrer"
          passHref
          className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl sm:rounded-2xl"
          aria-label={`Read more about ${title} (opens in new tab)`}
        >
          <div className="cursor-pointer h-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            {children}
          </div>
        </Link>
      );
    }
    return (
      <div className="h-full cursor-default" role="article">
        {children}
      </div>
    );
  };

  return (
    <CardWrapper>
      <article className={`flex flex-col h-full ${hasLink ? "group" : ""}`}>
        {/* Image with soft rounded corners - no outer card border */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-xl sm:rounded-2xl">
          {hasImage && !imageError ? (
            <>
              <Image
                src={getImageUrl()}
                alt={post.title || "Post image"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={false}
                loading="lazy"
                className={`object-cover transition-transform duration-700 ${hasLink ? "group-hover:scale-105" : ""}`}
                onError={() => setImageError(true)}
                style={{ objectPosition: "center center" }}
              />
              <div
                className={`absolute inset-0 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 ${hasLink ? "group-hover:opacity-50" : ""}`}
              />
              {hasLink && (
                <div
                  className="absolute bottom-3 right-3 z-10 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                  aria-hidden="true"
                >
                  <div className="p-2 rounded-full bg-primary/85 backdrop-blur-sm shadow-md border border-white/20">
                    <ExternalLink className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src="/shadowrun_invite_banner.png"
                alt="Shadowrun FPS Banner"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                unoptimized={false}
              />
            </div>
          )}

          {/* Type badge – smaller, lighter so it doesn’t compete with the image */}
          <div className="absolute z-10 top-2.5 left-2.5 sm:top-3 sm:left-3">
            <span
              className={`inline-block px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-md backdrop-blur-sm ${
                post.type === "EVENT"
                  ? "bg-primary/35 text-white"
                  : "bg-black/40 text-white"
              }`}
            >
              {post.type || "Post"}
            </span>
          </div>

          {/* Date – same minimal style as type for consistency */}
          <div className="absolute z-10 top-2.5 right-2.5 sm:top-3 sm:right-3">
            <span className="inline-block px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white rounded-md bg-black/40 backdrop-blur-sm">
              {formatDate()}
            </span>
          </div>
        </div>

        {/* Content on the page below image – more space between image and title */}
        <div className="flex flex-col flex-grow pt-5 sm:pt-6 space-y-2">
          <h3
            className={`text-lg sm:text-xl font-bold leading-tight text-foreground line-clamp-2 transition-colors duration-300 ${hasLink ? "group-hover:text-primary group-hover:underline group-hover:underline-offset-2" : ""}`}
          >
            {title}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {post.description ||
              post.excerpt ||
              post.summary ||
              "No description available"}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 pt-1 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium">
              By {post.authorNickname || post.author || post.creator || "Unknown"}
            </span>
          </div>
        </div>
      </article>
    </CardWrapper>
  );
}
