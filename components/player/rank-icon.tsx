import { EloRankGroup } from "@/types/types";
import Image from "next/image";

const rankIcons: { [char: string]: string } = {
  Bronze: "01_bronze",
  Silver: "02_silver",
  Gold: "03_gold",
  Diamond: "diamond_v002",
  Platinum: "platinum_v002",
};

function getPlayerRank(elo: number): EloRankGroup {
  if (elo >= 0 && elo <= 1099) {
    return "Bronze";
  } else if (elo >= 1100 && elo <= 1299) {
    return "Silver";
  } else if (elo >= 1300 && elo <= 1499) {
    return "Gold";
  } else if (elo >= 1500 && elo <= 1799) {
    return "Platinum";
  } else if (elo >= 1800 && elo <= 3000) {
    return "Diamond";
  }
  return "Bronze";
}

export default function RankIcon({
  elo,
  showElo = false,
}: {
  elo: number;
  showElo?: boolean;
}) {
  const playerRank = getPlayerRank(elo);

  return (
    <div>
      <Image
        className="mr-2 not-prose"
        src={`/rankedicons/${rankIcons[playerRank]}.png`}
        alt={`${playerRank} Rank`}
        width={20}
        height={20}
      />
      {showElo ?? elo}
    </div>
  );
}
