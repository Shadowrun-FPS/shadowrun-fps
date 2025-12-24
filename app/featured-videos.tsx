interface FeaturedVideoSettings {
  type: "none" | "youtube" | "twitch";
  youtubeUrl: string;
  twitchChannel: string;
  title: string;
}

async function getFeaturedVideoSettings(): Promise<FeaturedVideoSettings> {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = baseUrl.startsWith("http") 
      ? `${baseUrl}/api/featured-video`
      : `http://localhost:3000/api/featured-video`;
    
    const response = await fetch(url, {
      next: { 
        revalidate: 10, // Shorter cache time
        tags: ["featured-video"] // Tag for revalidation
      },
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching featured video settings:", error);
  }
  
  return {
    type: "none",
    youtubeUrl: "",
    twitchChannel: "",
    title: "",
  };
}

function extractYouTubeVideoId(url: string): string {
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

function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return "";
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

function getTwitchEmbedUrl(channel: string, hostname: string = "shadowrunfps.com"): string {
  if (!channel) return "";
  const cleanChannel = channel.replace(/^https?:\/\/(www\.)?twitch\.tv\//, "").replace(/\/$/, "");
  return `https://player.twitch.tv/?channel=${cleanChannel}&parent=${hostname}&muted=false`;
}

export async function hasFeaturedVideo(): Promise<boolean> {
  const settings = await getFeaturedVideoSettings();
  return (
    settings.type !== "none" &&
    ((settings.type === "youtube" && !!settings.youtubeUrl) ||
      (settings.type === "twitch" && !!settings.twitchChannel))
  );
}

export default async function FeaturedVideos() {
  const settings = await getFeaturedVideoSettings();

  if (settings.type === "none") {
    return null;
  }

  let embedUrl = "";
  let title = settings.title || "Featured Video";

  if (settings.type === "youtube" && settings.youtubeUrl) {
    embedUrl = getYouTubeEmbedUrl(settings.youtubeUrl);
  } else if (settings.type === "twitch" && settings.twitchChannel) {
    // Get hostname from environment or use default
    const hostname = process.env.NEXT_PUBLIC_SITE_URL 
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
      : "shadowrunfps.com";
    embedUrl = getTwitchEmbedUrl(settings.twitchChannel, hostname);
  }

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-muted-foreground">Invalid video configuration.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-4 md:mx-8">
      <iframe
        className="rounded-md aspect-video w-full"
        src={embedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title={title}
      />
      {title && (
        <div className="text-center text-white mt-4">
          <h2 className="text-2xl font-bold md:text-4xl not-prose">
            {title}
          </h2>
        </div>
      )}
    </div>
  );
}
