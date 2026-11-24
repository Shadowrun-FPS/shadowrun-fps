import { memo } from "react";
import Image from "next/image";

import {
  RANK_TIER_EMBLEM,
  RANK_TIER_LABELS,
} from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type { LeaderboardRankTier } from "@/types";

interface RankTierMarkProps {
  tier: LeaderboardRankTier;
  className?: string;
  /** Display size in pixels. Default 24. */
  size?: number;
}

/** Ranked-tier emblem shown immediately before a player name. */
export const RankTierMark = memo(function RankTierMark({
  tier,
  className,
  size = 24,
}: RankTierMarkProps) {
  const label = RANK_TIER_LABELS[tier];

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      title={label}
    >
      <Image
        src={RANK_TIER_EMBLEM[tier]}
        alt={label}
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </span>
  );
});

interface PlayerIdentityProps {
  name: string;
  tier?: LeaderboardRankTier;
  nameClassName?: string;
  className?: string;
  markSize?: number;
}

export const PlayerIdentity = memo(function PlayerIdentity({
  name,
  tier,
  nameClassName,
  className,
  markSize = 24,
}: PlayerIdentityProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      {tier ? <RankTierMark tier={tier} size={markSize} /> : null}
      <span className={cn("min-w-0 truncate", nameClassName)}>{name}</span>
    </span>
  );
});
