"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ReadyButton() {
  const [isReady, setIsReady] = useState(false);
  // TODO: have countdown timer started on match start and distributed to all clients
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes in seconds

  useEffect(() => {
    if (!isReady && timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [isReady, timeLeft]);

  const handleReadyClick = () => {
    setIsReady(true);
    // Update the current player's ready status
  };
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p>You have {timeLeft} seconds to mark yourself as ready.</p>
      <Button onClick={handleReadyClick} disabled={isReady}>
        {isReady ? "Ready" : "Mark as Ready"}
      </Button>
    </div>
  );
}
