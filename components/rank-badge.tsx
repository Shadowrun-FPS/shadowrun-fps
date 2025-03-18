import { getRankByElo } from "@/lib/rank-utils";

interface RankBadgeProps {
  elo: number;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ elo, size = "md" }: RankBadgeProps) {
  const rank = getRankByElo(elo);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <div
      className={`rounded-full font-medium ${sizeClasses[size]} ${rank.bgColor} ${rank.textColor} border ${rank.borderColor}`}
    >
      {rank.name}
    </div>
  );
}
