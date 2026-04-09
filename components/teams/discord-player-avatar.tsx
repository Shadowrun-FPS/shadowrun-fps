"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getDiscordDefaultAvatarUrl } from "@/lib/discord-default-avatar";

function primaryAvatarUrl(
  storedAvatarUrl: string | null | undefined,
  resolvedAvatarUrl: string | null | undefined,
  discordId: string
): string {
  const a = typeof storedAvatarUrl === "string" ? storedAvatarUrl.trim() : "";
  if (a !== "") return a;
  const b =
    typeof resolvedAvatarUrl === "string" ? resolvedAvatarUrl.trim() : "";
  if (b !== "") return b;
  return getDiscordDefaultAvatarUrl(discordId);
}

type DiscordPlayerAvatarProps = {
  discordId: string;
  displayName: string;
  /** `Players.discordProfilePicture` — preferred when set */
  storedAvatarUrl?: string | null;
  /** Search API `profilePicture` — fallback if raw stored field is absent */
  resolvedAvatarUrl?: string | null;
  className?: string;
};

/**
 * Loads Discord avatars with `referrerPolicy="no-referrer"` — without it, Discord CDN
 * often fails hotlinked requests and the image falls back to initials.
 * Tries stored URL first, then resolved URL, then default embed avatar, then initials.
 */
export function DiscordPlayerAvatar({
  discordId,
  displayName,
  storedAvatarUrl,
  resolvedAvatarUrl,
  className,
}: DiscordPlayerAvatarProps) {
  const defaultUrl = getDiscordDefaultAvatarUrl(discordId);

  const [src, setSrc] = useState(() =>
    primaryAvatarUrl(storedAvatarUrl, resolvedAvatarUrl, discordId)
  );
  const [showInitials, setShowInitials] = useState(false);

  useEffect(() => {
    setShowInitials(false);
    setSrc(primaryAvatarUrl(storedAvatarUrl, resolvedAvatarUrl, discordId));
  }, [storedAvatarUrl, resolvedAvatarUrl, discordId]);

  const handleError = () => {
    setSrc((current) => {
      if (current !== defaultUrl) {
        return defaultUrl;
      }
      setShowInitials(true);
      return current;
    });
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      {showInitials ? (
        <span className="text-sm font-medium text-muted-foreground">
          {displayName.charAt(0).toUpperCase()}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- Discord CDN + referrerPolicy; avoids Next/Image optimizer edge cases
        <img
          key={src}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover"
          onError={handleError}
        />
      )}
    </div>
  );
}
