"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, CircleSlash } from "lucide-react";
import { getMatchReadyCheck, handleReadyCheck } from "@/app/matches/actions";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { MatchPlayer } from "@/types/types";
import Timer from "@/components/util/timer";

export default function ReadyButton({
  matchId,
  players,
}: {
  matchId: string;
  players: MatchPlayer[];
}) {
  const { data: session } = useSession();
  const discordId = session?.user.id;
  const { toast } = useToast();
  const existingPlayer = players.find((p) => p.discordId === discordId);
  const [isReady, setIsReady] = useState(existingPlayer?.isReady || false);
  const [timeLeft, setTimeLeft] = useState(0);
  // TODO: have countdown timer started on match start and distributed to all clients
  const timerStatus = isReady ? "stop" : "start";

  useEffect(() => {
    // Get the current time remaining
    async function getTimeRemaining() {
      const response = await getMatchReadyCheck(matchId);
      console.log("Ready check time remaining", response);
      setTimeLeft(response.timeRemaining);
    }
    getTimeRemaining();
  }, [matchId]);

  const handleReadyClick = () => {
    if (!discordId) {
      console.error("No discordId found for user");
      toast({
        title: "Unable to mark ready",
        description: "Please login to mark yourself as ready",
      });
      return;
    }
    setIsReady(!isReady);
    // Update the current player's ready status
    handleReadyCheck(matchId, session?.user.id, isReady);
  };
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p>
        You have <Timer initialCount={timeLeft} status={timerStatus} /> seconds
        to mark yourself as ready.
      </p>
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
