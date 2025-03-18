export type RankTier =
  | "Obsidian"
  | "Diamond"
  | "Platinum"
  | "Gold"
  | "Silver"
  | "Bronze";

interface RankInfo {
  name: RankTier;
  min: number;
  max: number;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const RANKS: RankInfo[] = [
  {
    name: "Obsidian",
    min: 2300,
    max: 9999,
    color: "bg-gradient-to-r from-purple-900 to-black",
    textColor: "text-purple-200",
    bgColor: "bg-purple-900/20",
    borderColor: "border-purple-900/50",
  },
  {
    name: "Diamond",
    min: 1900,
    max: 2299,
    color: "bg-sky-500",
    textColor: "text-sky-300",
    bgColor: "bg-sky-500/20",
    borderColor: "border-sky-500/50",
  },
  {
    name: "Platinum",
    min: 1500,
    max: 1899,
    color: "bg-emerald-500",
    textColor: "text-emerald-300",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
  },
  {
    name: "Gold",
    min: 1200,
    max: 1499,
    color: "bg-yellow-500",
    textColor: "text-yellow-300",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50",
  },
  {
    name: "Silver",
    min: 900,
    max: 1199,
    color: "bg-gray-400",
    textColor: "text-gray-300",
    bgColor: "bg-gray-400/20",
    borderColor: "border-gray-400/50",
  },
  {
    name: "Bronze",
    min: 0,
    max: 899,
    color: "bg-amber-700",
    textColor: "text-amber-300",
    bgColor: "bg-amber-700/20",
    borderColor: "border-amber-700/50",
  },
];

export function getRankByElo(elo: number): RankInfo {
  return (
    RANKS.find((rank) => elo >= rank.min && elo <= rank.max) ||
    RANKS[RANKS.length - 1]
  );
}

export function getRankColor(rankName: string): string {
  const rank = RANKS.find((r) => r.name === rankName);
  return rank ? rank.color : "bg-gray-500";
}

export function getRankProgress(elo: number, rankName: string): number {
  const currentRank = RANKS.find((r) => r.name === rankName);
  if (!currentRank) return 0;

  if (rankName === "Obsidian") return 100; // Max rank

  const rangeSize = currentRank.max - currentRank.min;
  const progress = ((elo - currentRank.min) / rangeSize) * 100;

  return Math.min(Math.max(progress, 0), 100);
}
