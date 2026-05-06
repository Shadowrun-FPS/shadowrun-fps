"use client";

import { memo, useCallback, useState } from "react";
import { Play } from "lucide-react";
import { withEmbedAutoplayOnActivation } from "@/lib/featured-video";
import { cn } from "@/lib/utils";

export interface BroadcastEmbedProps {
  type: "youtube" | "twitch";
  embedUrl: string;
  title: string;
  youtubeVideoId?: string;
  twitchChannel?: string;
  className?: string;
}

function BroadcastEmbedInner({
  type,
  embedUrl,
  title,
  youtubeVideoId,
  twitchChannel,
  className,
}: BroadcastEmbedProps) {
  const [active, setActive] = useState(false);
  const [posterSrc, setPosterSrc] = useState(() =>
    type === "youtube" && youtubeVideoId
      ? `https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`
      : ""
  );

  const onPosterError = useCallback(() => {
    if (!youtubeVideoId) return;
    setPosterSrc((prev) => {
      if (prev.includes("maxresdefault")) {
        return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
      }
      if (prev.includes("hqdefault")) {
        return `https://i.ytimg.com/vi/${youtubeVideoId}/mqdefault.jpg`;
      }
      return prev;
    });
  }, [youtubeVideoId]);

  if (active) {
    const src = withEmbedAutoplayOnActivation(embedUrl, type);
    return (
      <div className={cn("relative aspect-video w-full", className)}>
        <iframe
          className="h-full w-full"
          src={src}
          title={title}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-black",
        className
      )}
    >
      {type === "youtube" && youtubeVideoId && posterSrc ? (
        <img
          src={posterSrc}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={onPosterError}
        />
      ) : null}
      {type === "twitch" ? (
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#1a1a1d] to-[#0e0e10]"
          aria-hidden
        />
      ) : null}
      {type === "twitch" && twitchChannel ? (
        <p
          className="absolute bottom-12 left-0 right-0 px-4 text-center text-xs font-medium tracking-wide text-white/70 uppercase"
          aria-hidden
        >
          {twitchChannel.replace(/^https?:\/\/(www\.)?twitch\.tv\//, "")}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setActive(true)}
        className="group absolute inset-0 flex items-center justify-center gap-3 bg-black/25 transition-colors hover:bg-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label={`Load and play: ${title}`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/65 shadow-lg backdrop-blur-[2px] transition-transform group-hover:scale-105">
          <Play
            className="ml-1 h-9 w-9 text-white"
            fill="currentColor"
            aria-hidden
          />
        </span>
      </button>
    </div>
  );
}

export const BroadcastEmbed = memo(BroadcastEmbedInner);
