"use client";
import Link from "next/link";
import RankIcon from "./rank-icon";
import { useEffect, useState } from "react";
import { Player } from "@/types/types";
import { getPlayer } from "@/app/actions";

export default function PlayerItem({
  discordId,
  matchTeamSize,
}: {
  discordId: string;
  matchTeamSize: number;
}) {
  const [playerData, setPlayerData] = useState<Player | null>(null);
  useEffect(() => {
    getPlayer(discordId).then((data) => setPlayerData(data));
  }, [discordId]);
  // TODO: show elo number with difference from last match
  // if (playerData === null)
  //   return (
  //     <div className="flex p-2 transition duration-300 rounded hover:bg-accent">
  //       Could not find player
  //     </div>
  //   );
  const playerStats = playerData?.stats;
  const teamSizeStats = playerStats?.find(
    (stat) => stat.teamSize === matchTeamSize
  );
  const elo = teamSizeStats?.elo ?? 0;
  return (
    <Link href={`/matches/stats/${discordId}`}>
      <div className="flex p-2 transition duration-300 rounded hover:bg-accent">
        <RankIcon elo={elo} />
        <div
          className="font-semibold overflow-hidden whitespace-nowrap max-w-[24ch]"
          title={playerData?.discordNickname}
        >
          {playerData?.discordNickname}
        </div>
      </div>
    </Link>
  );
}
