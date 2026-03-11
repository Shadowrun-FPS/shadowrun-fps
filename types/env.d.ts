/**
 * Typed environment variables (NEXT_PUBLIC_* are inlined at build time).
 * Add new social or public env keys here for editor hints and type safety.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Web URL for Discord (e.g. invite link). */
    NEXT_PUBLIC_SOCIAL_DISCORD?: string;
    /** Optional deep link to open Discord in app (e.g. discord://...). When set, Discord icon uses this. */
    NEXT_PUBLIC_SOCIAL_DISCORD_APP?: string;
    NEXT_PUBLIC_SOCIAL_TIKTOK?: string;
    NEXT_PUBLIC_SOCIAL_YOUTUBE?: string;
    NEXT_PUBLIC_SOCIAL_TWITTER?: string;
    NEXT_PUBLIC_SOCIAL_TWITCH?: string;
    NEXT_PUBLIC_SOCIAL_INSTAGRAM?: string;
    NEXT_PUBLIC_SOCIAL_FACEBOOK?: string;
    NEXT_PUBLIC_SOCIAL_RUMBLE?: string;
  }
}
