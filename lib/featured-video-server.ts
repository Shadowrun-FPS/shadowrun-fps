import "server-only";
import clientPromise from "@/lib/mongodb";
import type { FeaturedVideoSettings } from "@/lib/featured-video";

const defaultSettings: FeaturedVideoSettings = {
  type: "none",
  youtubeUrl: "",
  twitchChannel: "",
  title: "",
  lastUpdated: null,
};

/**
 * Fetches featured video settings directly from MongoDB.
 * Use this in Server Components to avoid an internal HTTP round-trip
 * that would force dynamic rendering on every request.
 */
export async function fetchFeaturedVideoSettingsServer(): Promise<FeaturedVideoSettings> {
  try {
    const client = await clientPromise;
    const db = client.db();

    const doc = await db
      .collection("ui_settings")
      .findOne({ component: "featured_video" });

    if (!doc) return { ...defaultSettings };

    const raw = doc.settings ?? defaultSettings;
    const updatedAt = (raw as { updatedAt?: Date }).updatedAt;
    const lastUpdated =
      updatedAt instanceof Date
        ? updatedAt.toISOString()
        : typeof updatedAt === "string"
          ? updatedAt
          : null;

    return {
      type: raw.type ?? "none",
      youtubeUrl: raw.youtubeUrl ?? "",
      twitchChannel: raw.twitchChannel ?? "",
      title: raw.title ?? "",
      lastUpdated,
    };
  } catch {
    return { ...defaultSettings };
  }
}
