export interface RankThreshold {
  name: string;
  min: number;
  max: number;
  icon: string;
}

export const RANK_THRESHOLDS: RankThreshold[] = [
  {
    name: "Obsidian",
    min: 2300,
    max: Infinity,
    icon: "/rankedicons/obsidian.png",
  },
  { name: "Diamond", min: 1900, max: 2299, icon: "/rankedicons/diamond.png" },
  { name: "Platinum", min: 1500, max: 1899, icon: "/rankedicons/platinum.png" },
  { name: "Gold", min: 1200, max: 1499, icon: "/rankedicons/gold.png" },
  { name: "Silver", min: 900, max: 1199, icon: "/rankedicons/silver.png" },
  { name: "Bronze", min: 0, max: 899, icon: "/rankedicons/bronze.png" },
];

export function getRankFromElo(elo: number): RankThreshold {
  return (
    RANK_THRESHOLDS.find((rank) => elo >= rank.min && elo <= rank.max) ||
    RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1]
  ); // Default to Bronze
}
