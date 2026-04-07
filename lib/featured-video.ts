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
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function getTwitchEmbedUrl(
  channel: string,
  hostname: string = "shadowrunfps.com"
): string {
  if (!channel) return "";
  const cleanChannel = channel
    .replace(/^https?:\/\/(www\.)?twitch\.tv\//, "")
    .replace(/\/$/, "");
  return `https://player.twitch.tv/?channel=${cleanChannel}&parent=${hostname}&muted=false`;
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
      : "shadowrunfps.com";
    return getTwitchEmbedUrl(settings.twitchChannel, hostname);
  }
  return "";
}
