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

interface Player {
  name: string;
  elo: number;
}

const rankIcons: { [char: string]: string } = {
  bronze: "01_bronze",
  silver: "02_silver",
  gold: "03_gold",
  diamond: "diamond_v002",
  platinum: "platinum_v002",
};

function getPlayerRank(elo: number): string {
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

function generateRandomName(): string {
  const nameLength = Math.floor(Math.random() * 24) + 1;
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let name = "";

  for (let i = 0; i < nameLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    name += characters.charAt(randomIndex);
  }

  return name;
}

function generatePlayers(numPlayers: number): Player[] {
  const players: Player[] = [];

  for (let i = 0; i < numPlayers; i++) {
    const elo = Math.floor(Math.random() * 501) + 1000; // Generate random Elo between 1000 and 1500
    const name = generateRandomName();
    players.push({ name, elo });
  }

  return players;
}

const numberOfPlayers = 10; // You can change this number as per your requirement
const players = generatePlayers(numberOfPlayers);

export default function MatchCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Match 1</CardTitle>
        <CardDescription>Match Description</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-md mx-auto prose">
          <div className="grid grid-cols-2 gap-x-4">
            <h5 className="p-2">Team 1</h5>
            <h5 className="p-2">Team 2</h5>
            {players.map((player) => {
              const playerRank = getPlayerRank(player.elo);
              const playerRankIcon = rankIcons[playerRank.toLowerCase()];
              return (
                <div className="flex p-2 transition duration-300 rounded hover:bg-gray-100">
                  <Image
                    className="mr-2 not-prose"
                    src={`/rankedicons/${playerRankIcon}.png`}
                    alt={`${playerRank} Rank`}
                    width={20}
                    height={20}
                  />
                  <div
                    className="font-semibold overflow-hidden whitespace-nowrap max-w-[10ch]"
                    title={player.name}
                  >
                    {player.name}
                  </div>
                </div>
              );
            })}
          </div>
          <p>Elapsed time: 10:32</p>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-4">
        <Button>Join</Button>
        <Button variant="secondary">Leave</Button>
      </CardFooter>
    </Card>
  );
}
