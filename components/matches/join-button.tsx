"use client";
import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";

type JoinLeaveButtonProps = {
  matchId: string;
  userName: string | null | undefined;
};

export default function JoinLeaveButton({
  matchId,
  userName,
}: JoinLeaveButtonProps) {
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

  return (
    <Button disabled={userName !== undefined} onClick={handleButtonClick}>
      {"Join"}
    </Button>
  );
}
