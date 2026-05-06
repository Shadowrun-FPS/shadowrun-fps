import { BroadcastEmbed } from "@/components/broadcast-embed";
import {
  buildFeaturedEmbedUrl,
  extractYouTubeVideoId,
  fetchFeaturedVideoSettings,
} from "@/lib/featured-video";

export async function hasFeaturedVideo(): Promise<boolean> {
  const settings = await fetchFeaturedVideoSettings();
  return (
    settings.type !== "none" &&
    ((settings.type === "youtube" && !!settings.youtubeUrl) ||
      (settings.type === "twitch" && !!settings.twitchChannel))
  );
}

/** @deprecated Prefer {@link HomeBroadcastVideo} on the home page. */
export default async function FeaturedVideos() {
  const settings = await fetchFeaturedVideoSettings();
  const embedUrl = buildFeaturedEmbedUrl(settings);

  if (settings.type === "none" || !embedUrl) {
    return null;
  }

  const title = settings.title || "Featured Video";
  const youtubeVideoId =
    settings.type === "youtube"
      ? extractYouTubeVideoId(settings.youtubeUrl)
      : "";

  return (
    <div className="relative mx-4 md:mx-8">
      <BroadcastEmbed
        type={settings.type === "youtube" ? "youtube" : "twitch"}
        embedUrl={embedUrl}
        title={title}
        youtubeVideoId={youtubeVideoId || undefined}
        twitchChannel={
          settings.type === "twitch" ? settings.twitchChannel : undefined
        }
        className="rounded-md"
      />
      {title && (
        <div className="mt-4 text-center text-white not-prose">
          <h2 className="text-2xl font-bold md:text-4xl">{title}</h2>
        </div>
      )}
    </div>
  );
}
