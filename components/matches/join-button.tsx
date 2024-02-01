"use client";
import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";
import { Player } from "@/types/types";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

type JoinLeaveButtonProps = {
  isMatchFull: boolean;
  matchId: string;
  players?: Player[]; // Make players optional to handle undefined case
};

export default function JoinLeaveButton({
  isMatchFull,
  matchId,
  players = [],
}: JoinLeaveButtonProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name;

  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Check if the current user is already joined
    if (userName && players.some((player) => player.discordId === userName)) {
      setIsJoined(true);
    } else {
      setIsJoined(false);
    }
  }, [userName, players]);

  const handleButtonClick = () => {
    const url = getApiUrl();

    if (isJoined) {
      fetch(url + "/api/matches", {
        method: "POST",
        body: JSON.stringify({
          action: "removePlayer",
          matchId,
          player: {
            playerId: userName,
            discordId: userName,
            discordNickname: userName,
          },
        }),
      }).then(() => {
        updateMatchAction();
        setIsJoined(false);
      });
    } else {
      fetch(url + "/api/matches", {
        method: "POST",
        body: JSON.stringify({
          action: "addPlayer",
          matchId,
          player: {
            playerId: userName,
            discordId: userName,
            discordNickname: userName,
          },
        }),
      }).then(() => {
        updateMatchAction();
        setIsJoined(true);
      });
    }
  };

  return (
    <Button
      disabled={!(session !== undefined && !isMatchFull)}
      onClick={handleButtonClick}
    >
      {isJoined ? "Leave" : isMatchFull ? "Full" : "Join"}
    </Button>
  );
}
