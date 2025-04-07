import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getRankIconPath } from "@/lib/ranks";
import Link from "next/link";

interface TeamCardProps {
  team: any[];
  teamNumber: number;
  title: string;
  matchStatus?: string; // Add this to check if match is completed
}

export function TeamCard({
  team,
  teamNumber,
  title,
  matchStatus,
}: TeamCardProps) {
  // Calculate total team ELO
  const teamElo = team.reduce((total, player) => total + (player.elo || 0), 0);
  const isMatchCompleted = matchStatus === "completed";

  // Add console.log to verify ELO calculation
  console.log(`Team ${teamNumber} total ELO:`, teamElo);

  return (
    <Card className="bg-[#111827] border-[#1f2937]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <Badge
          variant="outline"
          className="bg-[#1a2234] text-white border-[#374151] px-3 py-1 text-sm"
        >
          Team ELO: {teamElo.toLocaleString()}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {team.map((player) => (
          <div
            key={player.discordId}
            className="flex items-center justify-between p-2 rounded-lg bg-[#1a2234]"
          >
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={player.discordProfilePicture || ""}
                  alt={player.discordNickname}
                />
                <AvatarFallback>
                  {player.discordNickname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link
                  href={`/player/stats?playerName=${encodeURIComponent(
                    player.discordUsername
                  )}`}
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {player.discordNickname || player.discordUsername}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6">
                <Image
                  src={getRankIconPath(player.elo)}
                  alt="Rank"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
              <span className="text-gray-400">{player.elo}</span>
              {isMatchCompleted &&
                player.eloChange !== 0 &&
                player.eloChange !== undefined && (
                  <span
                    className={`text-sm ${
                      player.eloChange > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {player.eloChange > 0 ? "+" : ""}
                    {player.eloChange}
                  </span>
                )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
