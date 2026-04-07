"use client";

import { useState } from "react";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_MAP: Record<number, string> = {
  8: "h-8 w-8",
  10: "h-10 w-10",
  12: "h-12 w-12",
  14: "h-14 w-14",
  16: "h-16 w-16",
};

type TournamentMemberAvatarProps = {
  profilePicture: string | null | undefined;
  username: string | null | undefined;
  size: number;
  className?: string;
};

export function TournamentMemberAvatar({
  profilePicture,
  username,
  size,
  className,
}: TournamentMemberAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_MAP[size] ?? "h-10 w-10";

  if (profilePicture && !imgError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-border/50 bg-muted",
          sizeClass,
          className,
        )}
      >
        <Image
          src={profilePicture}
          alt={username || "Member"}
          width={size * 4}
          height={size * 4}
          loading="lazy"
          className="h-full w-full object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-border/50 bg-muted",
        sizeClass,
        className,
      )}
    >
      <UserCircle className="h-full w-full text-muted-foreground" aria-hidden />
    </div>
  );
}
