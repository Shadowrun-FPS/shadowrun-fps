import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Player, MatchResult } from "@/types/types";

interface MatchCardProps {
  match: MatchResult;
}

const rankIcons: { [char: string]: string } = {
  bronze: "01_bronze",
  silver: "02_silver",
  gold: "03_gold",
  diamond: "diamond_v002",
  platinum: "platinum_v002",
};

function getPlayerRank(player: Player, matchTeamSize: number): string {
  console.log("player: ", player);
  if (!player.stats) return "Unknown";
  const getTeamSizeStats = player.stats.find(
    (stat) => stat.teamSize === matchTeamSize
  );
  const elo = getTeamSizeStats?.elo ?? 0;
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
  } else {
    return "Unknown";
  }
}

export default function MatchCard({ match }: MatchCardProps) {
  const { players } = match;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{match.matchId}</CardTitle>
        <CardDescription>
          {match.gameMode}
          <p>Elapsed time: 10:32</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-x-4">
            <h5 className="p-2">Team 1</h5>
            <h5 className="p-2">Team 2</h5>
            {players.map((player: Player) => {
              const playerRank = getPlayerRank(player, match.teamSize);
              const playerRankIcon = rankIcons[playerRank.toLowerCase()];
              return (
                <div
                  key={player.playerId}
                  className="flex p-2 transition duration-300 rounded hover:bg-accent"
                >
                  <Image
                    className="mr-2 not-prose"
                    src={`/rankedicons/${playerRankIcon}.png`}
                    alt={`${playerRank} Rank`}
                    width={20}
                    height={20}
                  />
                  <div
                    className="font-semibold overflow-hidden whitespace-nowrap max-w-[10ch]"
                    title={player.playerId}
                  >
                    {player.playerId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-4">
        <Button>Join</Button>
        <Button variant="secondary">Leave</Button>
      </CardFooter>
    </Card>
  );
}
