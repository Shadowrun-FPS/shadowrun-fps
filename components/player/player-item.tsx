import { getPlayerInfo } from "@/lib/player-helpers";
import { EloRankGroup, Player } from "@/types/types";
import Image from "next/image";

const rankIcons: { [char: string]: string } = {
  Bronze: "01_bronze",
  Silver: "02_silver",
  Gold: "03_gold",
  Diamond: "diamond_v002",
  Platinum: "platinum_v002",
};

function getPlayerRank(
  playerData: Player,
  matchTeamSize: number
): EloRankGroup {
  const playerStats = playerData.stats;
  const teamSizeStats = playerStats.find(
    (stat) => stat.teamSize === matchTeamSize
  );
  const elo = teamSizeStats?.elo ?? 0;
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

export default async function PlayerItem({
  discordId,
  matchTeamSize,
}: {
  discordId: string;
  matchTeamSize: number;
}) {
  const playerData = await getPlayerInfo(discordId);
  //   console.log("playerData", playerData, discordId);
  if (playerData === null)
    return (
      <div className="flex p-2 transition duration-300 rounded hover:bg-accent">
        Could not find player
      </div>
    );
  const playerRank = getPlayerRank(playerData, matchTeamSize);
  return (
    <div className="flex p-2 transition duration-300 rounded hover:bg-accent">
      <Image
        className="mr-2 not-prose"
        src={`/rankedicons/${rankIcons[playerRank]}.png`}
        alt={`${playerRank} Rank`}
        width={20}
        height={20}
      />
      <div
        className="font-semibold overflow-hidden whitespace-nowrap max-w-[10ch]"
        title={playerData.discordNickname}
      >
        {playerData.discordNickname}
      </div>
    </div>
  );
}
