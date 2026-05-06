export type FeaturedVideoType = "none" | "youtube" | "twitch";

export interface FeaturedVideoSettings {
  type: FeaturedVideoType;
  youtubeUrl: string;
  twitchChannel: string;
  title: string;
  /** ISO date string when admin last saved featured video settings */
  lastUpdated?: string | null;
}

const defaultSettings: FeaturedVideoSettings = {
  type: "none",
  youtubeUrl: "",
  twitchChannel: "",
  title: "",
  lastUpdated: null,
};

export function extractYouTubeVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return "";
}

export function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return "";
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

/** Hostnames allowed as Twitch `parent` (hostname only, no port). */
export function getTwitchParentHostnames(hostname: string): string[] {
  const normalized = hostname.split(":")[0]?.toLowerCase() ?? "shadowrunfps.com";
  const parents = new Set<string>([normalized]);
  if (process.env.NODE_ENV === "development") {
    parents.add("localhost");
    parents.add("127.0.0.1");
  }
  return Array.from(parents);
}

/**
 * Used when the user activates the click-to-play facade so the embedded player
 * starts immediately (same gesture), avoiding a second click inside YouTube/Twitch.
 */
export function withEmbedAutoplayOnActivation(
  embedUrl: string,
  type: "youtube" | "twitch"
): string {
  try {
    const url = new URL(embedUrl);
    if (type === "youtube") {
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("playsinline", "1");
    } else {
      url.searchParams.set("autoplay", "true");
    }
    return url.toString();
  } catch {
    return embedUrl;
  }
}

export function getTwitchEmbedUrl(
  channel: string,
  hostname: string = "www.shadowrunfps.com"
): string {
  if (!channel) return "";
  const cleanChannel = channel
    .replace(/^https?:\/\/(www\.)?twitch\.tv\//, "")
    .replace(/\/$/, "");
  const parents = getTwitchParentHostnames(hostname);
  const params = new URLSearchParams();
  params.set("channel", cleanChannel);
  params.set("muted", "false");
  for (const parent of parents) {
    params.append("parent", parent);
  }
  return `https://player.twitch.tv/?${params.toString()}`;
}

export async function fetchFeaturedVideoSettings(): Promise<FeaturedVideoSettings> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const url = baseUrl.startsWith("http")
      ? `${baseUrl}/api/featured-video`
      : `http://localhost:3000/api/featured-video`;

    const response = await fetch(url, {
      next: {
        revalidate: 10,
        tags: ["featured-video"],
      },
    });

    if (response.ok) {
      return (await response.json()) as FeaturedVideoSettings;
    }
  } catch {
    // fall through
  }

  return { ...defaultSettings };
}

export function buildFeaturedEmbedUrl(
  settings: FeaturedVideoSettings
): string {
  if (settings.type === "youtube" && settings.youtubeUrl) {
    return getYouTubeEmbedUrl(settings.youtubeUrl);
  }
  if (settings.type === "twitch" && settings.twitchChannel) {
    const hostname = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
      : "www.shadowrunfps.com";
    return getTwitchEmbedUrl(settings.twitchChannel, hostname);
  }
  return "";
}
