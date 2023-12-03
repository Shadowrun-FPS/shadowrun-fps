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
import { Player, PlayerStats, Match, EloRankGroup } from "@/types/types";
import { createURL } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  className?: string;
}

const rankIcons: { [char: string]: string } = {
  bronze: "01_bronze",
  silver: "02_silver",
  gold: "03_gold",
  diamond: "diamond_v002",
  platinum: "platinum_v002",
};

function getTeamSizeStats(playerId: string, teamSize: number) {
  const url = createURL("/api/stats", {
    playerId,
  });
  console.log(url);
  return fetch(url, {
    cache: "no-cache",
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.results !== undefined) {
        return data.results.stats.find(
          (playerStats: PlayerStats) => playerStats.teamSize === teamSize
        );
      } else return undefined;
    })
    .catch((error) => console.error(error));
}

async function getPlayerRank(
  player: Player,
  matchTeamSize: number
): Promise<EloRankGroup> {
  const playerStats = await getTeamSizeStats(player.playerId, matchTeamSize);
  const elo = playerStats?.elo ?? 0;
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

export default function MatchCard({ match, className }: MatchCardProps) {
  const { players } = match;
  const isMatchFull = match.teamSize === players.length;
  return (
    <Card key={match.matchId} className={className}>
      <CardHeader>
        <CardTitle>{match.gameMode}</CardTitle>
        <CardDescription>
          <p>Team Size: {match.teamSize}</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-x-4">
            <h5 className="p-2">Team 1</h5>
            <h5 className="p-2">Team 2</h5>
            {players.map(async (player: Player) => {
              const playerRank = await getPlayerRank(player, match.teamSize);
              // console.log("playerRank: ", playerRank);
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
        <Button disabled={isMatchFull}>{isMatchFull ? "Full" : "Join"}</Button>
        <Button variant="secondary">Leave</Button>
      </CardFooter>
    </Card>
  );
}
