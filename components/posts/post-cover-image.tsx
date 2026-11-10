"use client";

import Image from "next/image";
import { memo, useState } from "react";
import {
  normalizeImageUrl,
  shouldSkipImageOptimization,
} from "@/lib/post-display";
import { cn } from "@/lib/utils";

interface PostCoverImageProps {
  imageUrl: string;
  alt: string;
  sizes: string;
  /** Above-the-fold covers load immediately. Everything else loads lazily. */
  priority?: boolean;
  /** Show the site key art when the image is missing or fails. Off renders nothing instead. */
  fallback?: boolean;
  onLoadError?: () => void;
  className?: string;
}

const FALLBACK_COVER_SRC = "/key-art-banner.png";

/** Fills its (relatively positioned) parent. */
function PostCoverImageComponent({
  imageUrl,
  alt,
  sizes,
  priority = false,
  fallback = true,
  onLoadError,
  className,
}: PostCoverImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const normalizedUrl = normalizeImageUrl(imageUrl);
  const hasUsableImage = Boolean(normalizedUrl) && failedUrl !== normalizedUrl;

  if (!hasUsableImage && !fallback) return null;

  const src = hasUsableImage ? normalizedUrl : FALLBACK_COVER_SRC;

  return (
    <Image
      src={src}
      alt={hasUsableImage ? alt : "Shadowrun FPS key art"}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      unoptimized={hasUsableImage && shouldSkipImageOptimization(src)}
      className={cn("object-cover", className)}
      onError={() => {
        setFailedUrl(normalizedUrl);
        onLoadError?.();
      }}
    />
  );
}

export const PostCoverImage = memo(PostCoverImageComponent);
