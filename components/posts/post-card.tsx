"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, ImageIcon } from "lucide-react";
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

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (hasLink) {
      return (
        <Link
          href={getLink()}
          target="_blank"
          rel="noopener noreferrer"
          passHref
          className="block h-full"
        >
          <div className="cursor-pointer h-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            {children}
          </div>
        </Link>
      );
    }
    return (
      <div className="h-full transition-all duration-300">
        {children}
      </div>
    );
  };

  return (
    <CardWrapper>
      <Card className="flex flex-col h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-xl bg-card">
        <div className="relative w-full h-48 sm:h-56 overflow-hidden group">
          {hasImage && !imageError ? (
            <>
              <Image
                src={getImageUrl()}
                alt={post.title || "Post image"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={false}
                loading="lazy"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
                style={{ objectPosition: "center center" }}
              />
              <div className="absolute inset-0 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-50" />
              {hasLink && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  aria-hidden="true"
                >
                  <div className="p-3 sm:p-4 rounded-full bg-primary/90 backdrop-blur-sm shadow-lg border-2 border-primary/20">
                    <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
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

          {/* Type badge positioned over the image */}
          <div className="absolute z-10 top-3 left-3">
            <Badge
              variant={post.type === "EVENT" ? "default" : post.type === "NEWS" ? "secondary" : "outline"}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-sm border border-white/10"
            >
              {post.type || "POST"}
            </Badge>
          </div>

          {/* Date positioned over the image */}
          <div className="absolute z-10 top-3 right-3">
            <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm text-white rounded-md bg-black/70 backdrop-blur-sm shadow-lg border border-white/10 font-medium">
              {formatDate()}
            </span>
          </div>
        </div>

        <CardContent className="flex-grow p-4 sm:p-5 space-y-3">
          <h3 className="text-lg sm:text-xl font-bold transition-colors duration-300 line-clamp-2 group-hover:text-primary leading-tight">
            {post.title || "Untitled"}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed">
            {post.description ||
              post.excerpt ||
              post.summary ||
              "No description available"}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 px-4 sm:px-5 py-3 sm:py-4 mt-auto border-t bg-muted/30">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            By {post.authorNickname || post.author || post.creator || "Unknown"}
          </span>
          {/* Only show "Read more" if there's actually a link */}
          {hasLink && (
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              <span>Read more</span>
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          )}
        </CardFooter>
      </Card>
    </CardWrapper>
  );
}
