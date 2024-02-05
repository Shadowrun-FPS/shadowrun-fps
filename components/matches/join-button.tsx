"use client";
import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";
import { Player } from "@/types/types";
import { useSession } from "next-auth/react";

type JoinLeaveButtonProps = {
  matchId: string;
  players?: Player[]; // Make players optional to handle undefined case
};

export default function JoinLeaveButton({
  matchId,
  players = [],
}: JoinLeaveButtonProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name;
  // const discordId = session?.token?.sub; // Retrieve Discord ID from the token

  const handleButtonClick = () => {
    const url = getApiUrl();
    fetch(url + "/api/matches", {
      method: "POST",
      body: JSON.stringify({
        action: "addPlayer",
        matchId,
        player: {
          playerId: userName,
          discordId: userName, // Use the Discord ID from the token
          discordNickname: userName,
        },
      }),
    }).then(() => {
      updateMatchAction();
    });
  };

  return <Button onClick={handleButtonClick}>{"Join"}</Button>;
}
