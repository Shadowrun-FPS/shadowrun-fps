"use client";
import { handleJoinQueue, handleLeaveQueue } from "@/app/matches/actions";
import { Button } from "@/components/ui/button";
import { EloTier, MatchPlayer } from "@/types/types";
import { Users } from "lucide-react";
import { useSession } from "next-auth/react";

type QueueButtonProps = {
  queueId: string;
  eloTier: EloTier;
  minElo: number;
  maxElo: number;
  players: MatchPlayer[];
  teamSize: number;
};

export default function QueueButton({
  queueId,
  eloTier,
  minElo,
  maxElo,
  players,
  teamSize,
}: QueueButtonProps) {
  const { data: session } = useSession();

  const discordId = session?.user?.id;
  const discordNickname = session?.user?.nickname;

  const isPlayerInQueue = players.some(
    (player) => player.discordId === discordId
  );

  async function handleClick() {
    if (isPlayerInQueue) {
      // Leave queue
      await handleLeaveQueue(queueId, discordId);
    } else {
      // Join queue
      if (discordId && discordNickname) {
        const newPlayer: MatchPlayer = {
          discordId,
          discordNickname,
        };
        await handleJoinQueue(queueId, newPlayer);
      }
    }
  }

  const buttonTitle = isPlayerInQueue ? "Leave" : "Queue";
  return (
    <div className="flex items-center gap-4">
      <span className="hidden md:block">
        <Users />
      </span>

      <div className="flex-1">
        <h3 className="font-semibold">{eloTier}</h3>
        <p className="text-xs prose dark:prose-invert">
          {minElo}-{maxElo}
        </p>
      </div>
      <Button
        className="w-28"
        variant={!isPlayerInQueue ? "secondary" : "destructive"}
        onClick={handleClick}
      >
        {buttonTitle} {players.length}/{teamSize * 2}
      </Button>
    </div>
  );
}
