"use client";
import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";
import { Player } from "@/types/types";
import { useSession } from "next-auth/react";

type JoinButtonProps = {
  isMatchFull: boolean;
  matchId: string;
};

export default function JoinButton({ isMatchFull, matchId }: JoinButtonProps) {
  const { data: session } = useSession();
  function handleJoin() {
    const url = getApiUrl();
    const userName = session?.user?.name;
    if (!userName) return;
    fetch(url + "/api/matches", {
      method: "POST",
      body: JSON.stringify({
        action: "addPlayer",
        matchId,
        player: {
          playerId: userName,
          discordId: userName,
        },
      }),
    }).then(() => {
      updateMatchAction();
    });
  }
  return (
    <Button
      disabled={!(session !== undefined && !isMatchFull)}
      onClick={handleJoin}
    >
      {isMatchFull ? "Full" : "Join"}
    </Button>
  );
}
