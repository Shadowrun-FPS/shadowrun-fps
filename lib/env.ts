/**
 * Typed access to NEXT_PUBLIC_* environment variables.
 * Use this instead of process.env when you need typed social URLs.
 */

export interface SocialUrls {
  discord: string | undefined;
  discordApp: string | undefined;
  tiktok: string | undefined;
  youtube: string | undefined;
  twitter: string | undefined;
  twitch: string | undefined;
  instagram: string | undefined;
  facebook: string | undefined;
  rumble: string | undefined;
}

function get(key: keyof SocialUrls): string | undefined {
  const map: Record<keyof SocialUrls, string | undefined> = {
    discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD,
    discordApp: process.env.NEXT_PUBLIC_SOCIAL_DISCORD_APP,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK,
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE,
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
    twitch: process.env.NEXT_PUBLIC_SOCIAL_TWITCH,
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    rumble: process.env.NEXT_PUBLIC_SOCIAL_RUMBLE,
  };
  const value = map[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

/** All social URLs from env. Undefined means not set or empty. */
export function getSocialUrls(): SocialUrls {
  return {
    discord: get("discord"),
    discordApp: get("discordApp"),
    tiktok: get("tiktok"),
    youtube: get("youtube"),
    twitter: get("twitter"),
    twitch: get("twitch"),
    instagram: get("instagram"),
    facebook: get("facebook"),
    rumble: get("rumble"),
  };
}
