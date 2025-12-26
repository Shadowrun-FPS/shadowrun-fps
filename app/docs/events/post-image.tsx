"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

interface PostImageProps {
  src: string;
  alt: string;
  href: string;
  className?: string; // Allow className prop
}

export default function PostImage({
  src,
  alt,
  href,
  className,
}: PostImageProps) {
  const [imageError, setImageError] = useState(false);
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  // Pre-check if image URL is valid (optional, helps catch obvious issues)
  useEffect(() => {
    if (isExternal && src) {
      // Reset error state when src changes
      setImageError(false);
    }
  }, [src, isExternal]);

  const imageContent = imageError ? (
    <Image
      src="/shadowrun_invite_banner.png"
      alt="Shadowrun FPS Banner"
      fill={true}
      style={{
        objectFit: "cover",
      }}
      unoptimized={false}
      loading="lazy"
      className={className}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      fill={true}
      style={{
        objectFit: "cover",
      }}
      unoptimized={isExternal}
      loading="lazy"
      className={className}
      onError={() => {
        setImageError(true);
      }}
      onLoadingComplete={() => {
        // Image loaded successfully
      }}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block w-full h-full ${className || ""}`}
        aria-label={`${alt} (opens in new window)`}
      >
        {imageContent}
      </Link>
    );
  } else {
    return (
      <div className={`relative w-full h-full ${className || ""}`}>
        {imageContent}
      </div>
    );
  }
}
