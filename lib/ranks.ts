// Define the rank tiers and their ELO ranges
export const RANK_TIERS = {
  OBSIDIAN: { min: 2300, name: "Obsidian" },
  DIAMOND: { min: 1900, max: 2299, name: "Diamond" },
  PLATINUM: { min: 1500, max: 1899, name: "Platinum" },
  GOLD: { min: 1200, max: 1499, name: "Gold" },
  SILVER: { min: 900, max: 1199, name: "Silver" },
  BRONZE: { min: 0, max: 899, name: "Bronze" },
} as const;

// Function to get the rank icon path based on ELO
export function getRankIconPath(elo: number): string {
  if (elo >= RANK_TIERS.OBSIDIAN.min) return "/rankedicons/obsidian.png";
  if (elo >= RANK_TIERS.DIAMOND.min) return "/rankedicons/diamond.png";
  if (elo >= RANK_TIERS.PLATINUM.min) return "/rankedicons/platinum.png";
  if (elo >= RANK_TIERS.GOLD.min) return "/rankedicons/gold.png";
  if (elo >= RANK_TIERS.SILVER.min) return "/rankedicons/silver.png";
  return "/rankedicons/@bronze.png";
}

// Function to get rank name based on ELO
export function getRankName(elo: number): string {
  if (elo >= RANK_TIERS.OBSIDIAN.min) return RANK_TIERS.OBSIDIAN.name;
  if (elo >= RANK_TIERS.DIAMOND.min) return RANK_TIERS.DIAMOND.name;
  if (elo >= RANK_TIERS.PLATINUM.min) return RANK_TIERS.PLATINUM.name;
  if (elo >= RANK_TIERS.GOLD.min) return RANK_TIERS.GOLD.name;
  if (elo >= RANK_TIERS.SILVER.min) return RANK_TIERS.SILVER.name;
  return RANK_TIERS.BRONZE.name;
}
