/**
 * Discord default user avatars (no custom avatar uploaded) — see
 * https://discord.com/developers/docs/reference#image-formatting
 */
export function getDiscordDefaultAvatarUrl(discordId: string): string {
  try {
    const id = BigInt(discordId);
    const index = Number((id >> BigInt(22)) % BigInt(6));
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

/** Prefer `Players.discordProfilePicture` when present; otherwise use default embed avatar. */
export function getStoredDiscordProfilePicture(
  player: Record<string, unknown>
): string | null {
  const raw = player.discordProfilePicture;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

/** Resolved avatar URL for APIs/UI: stored CDN URL first, then deterministic default. */
export function resolveDiscordAvatarUrl(
  discordId: string,
  player: Record<string, unknown>
): string {
  const stored = getStoredDiscordProfilePicture(player);
  if (stored) return stored;
  return getDiscordDefaultAvatarUrl(discordId);
}
