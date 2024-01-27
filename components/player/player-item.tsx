import { getPlayerInfo } from "@/lib/player-helpers";
import Link from "next/link";
import RankIcon from "./rank-icon";

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
  const playerStats = playerData.stats;
  const teamSizeStats = playerStats.find(
    (stat) => stat.teamSize === matchTeamSize
  );
  const elo = teamSizeStats?.elo ?? 0;
  return (
    <Link href={`/matches/stats/${discordId}`}>
      <div className="flex p-2 transition duration-300 rounded hover:bg-accent">
        <RankIcon elo={elo} />
        <div
          className="font-semibold overflow-hidden whitespace-nowrap max-w-[24ch]"
          title={playerData.discordNickname}
        >
          {playerData.discordNickname}
        </div>
      </div>
    </Link>
  );
}
