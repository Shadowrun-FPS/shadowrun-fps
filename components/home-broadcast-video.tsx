import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, Radio } from "lucide-react";
import {
  buildFeaturedEmbedUrl,
  fetchFeaturedVideoSettings,
} from "@/lib/featured-video";

const DEFAULT_WATCH_MORE_HREF =
  process.env.NEXT_PUBLIC_FEATURED_VIDEO_MORE_URL ||
  "https://www.youtube.com/results?search_query=shadowrun+fps+community";

export async function HomeBroadcastVideo() {
  const settings = await fetchFeaturedVideoSettings();
  const embedUrl = buildFeaturedEmbedUrl(settings);

  if (!embedUrl) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-muted/10 px-4 text-center text-muted-foreground">
        Invalid or missing video configuration.
      </div>
    );
  }

  const iframeTitle = settings.title?.trim() || "Featured Shadowrun FPS video";
  const lastUpdated = settings.lastUpdated
    ? new Date(settings.lastUpdated)
    : null;
  const dateLabel = lastUpdated
    ? format(lastUpdated, "MMMM d, yyyy")
    : "Featured";

  return (
    <div className="overflow-hidden rounded-2xl bg-[hsl(220_16%_8%)] shadow-xl shadow-black/25">
      {/* Faux channel chrome */}
      <div className="flex flex-col gap-3 bg-gradient-to-r from-[hsl(220_20%_12%)] to-[hsl(220_16%_10%)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12"
            aria-hidden
          >
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground sm:text-base">
              Community highlight
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dateLabel}
              {settings.type === "twitch" ? " · Live / channel" : " · Spotlight"}
            </p>
          </div>
        </div>
        <Link
          href={DEFAULT_WATCH_MORE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Watch more
          <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
      </div>

      <div className="relative bg-black">
        <div className="aspect-video w-full">
          <iframe
            className="h-full w-full"
            src={embedUrl}
            title={iframeTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
