"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, CircleSlash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ReadyTimer from "@/components/util/timer";

import {
  getMatchData,
  getMatchReadyCheck,
  handleReadyCheck,
} from "@/app/matches/actions";

import { MatchPlayer } from "@/types/types";

export default function ReadyButton({
  matchId,
  players,
  onClick,
}: {
  matchId: string;
  players: MatchPlayer[];
  onClick: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const discordId = session?.user.id;
  const { toast } = useToast();
  const existingPlayer = players.find(
    (p) => p.discordId === discordId
  ) as MatchPlayer;
  const [isReady, setIsReady] = useState(existingPlayer?.isReady || false);
  const [timeLeft, setTimeLeft] = useState(-1);
  // TODO: handle case where timeLeft hits 0 and all players aren't ready.
  const timerStatus = isReady || timeLeft === -1 ? "stop" : "start";
  useEffect(() => {
    // Get the current time remaining
    async function getTimeRemaining() {
      const response = await getMatchReadyCheck(matchId);
      const timeRemaining = response.timeRemaining;
      if (timeRemaining !== undefined) {
        setTimeLeft(timeRemaining);
      }
    }
    getTimeRemaining();
  }, [matchId]);

  const handleReadyClick = async () => {
    if (!discordId) {
      console.error("No discordId found for user");
      toast({
        title: "Unable to mark ready",
        description: "Please login to mark yourself as ready",
      });
      return;
    }
    const updatedReadyStatus = !isReady;
    setIsReady(updatedReadyStatus);
    // Update the current player's ready status
    await handleReadyCheck(matchId, session?.user.id, updatedReadyStatus);
    onClick();
    const updatedMatch = await getMatchData(matchId);
    if (updatedMatch?.status === "in-progress") {
      // navigate to the match page
      router.push(`/matches/${matchId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <ReadyTimer
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}
        status={timerStatus}
      />
      <Button
        onClick={handleReadyClick}
        variant={isReady ? "destructive" : "default"}
      >
        {isReady ? (
          <div className="flex items-center gap-2">
            Unready <CircleSlash color="#EF4444" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            Ready <CheckCircle color="#10B981" />
          </div>
        )}
      </Button>
    </div>
  );
}
