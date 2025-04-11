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
    // Check various possible date fields
    const dateValue =
      post.datePublished || post.date || post.createdAt || post.publishedAt;

    if (!dateValue) return "No date";

    try {
      // Try to parse the date - it could be a string or already a Date object
      const date =
        typeof dateValue === "string" ? new Date(dateValue) : dateValue;

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
  const getImageUrl = () => {
    return (
      post.imageUrl || post.image || post.thumbnail || post.featuredImage || ""
    );
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
        >
          <div className="cursor-pointer h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            {children}
          </div>
        </Link>
      );
    }
    return (
      <div className="h-full transition-all duration-300 hover:shadow-md">
        {children}
      </div>
    );
  };

  return (
    <CardWrapper>
      <Card className="flex flex-col h-full overflow-hidden border-2">
        <div className="relative w-full h-56 overflow-hidden group">
          {hasImage ? (
            <>
              <Image
                src={getImageUrl()}
                alt={post.title || "Post image"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImageError(true)}
                style={{ objectPosition: "center center" }}
              />
              <div className="absolute inset-0 transition-opacity duration-300 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40" />
              {hasLink && (
                <div className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <div className="p-3 rounded-full bg-primary/80">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-gradient-to-br from-gray-800 to-gray-900">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-sm">No image available</span>
            </div>
          )}

          {/* Type badge positioned over the image */}
          <div className="absolute z-10 top-3 left-3">
            <Badge
              variant={post.type === "EVENT" ? "default" : "secondary"}
              className="px-3 py-1 shadow-md"
            >
              {post.type || "POST"}
            </Badge>
          </div>

          {/* Date positioned over the image */}
          <div className="absolute z-10 top-3 right-3">
            <span className="px-2 py-1 text-xs text-white rounded-md bg-black/60">
              {formatDate()}
            </span>
          </div>
        </div>

        <CardContent className="flex-grow p-5">
          <h3 className="mb-3 text-xl font-bold transition-colors duration-300 line-clamp-2 group-hover:text-primary">
            {post.title || "Untitled"}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.description ||
              post.excerpt ||
              post.summary ||
              "No description available"}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between px-5 py-4 mt-auto border-t">
          <span className="text-xs text-muted-foreground">
            By {post.authorNickname || post.author || post.creator || "Unknown"}
          </span>
          {/* Only show "Read more" if there's actually a link */}
          {hasLink && (
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              <span>Read more</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          )}
        </CardFooter>
      </Card>
    </CardWrapper>
  );
}
