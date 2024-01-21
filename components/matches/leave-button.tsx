"use client";
import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";
import { Player } from "@/types/types";
import { useSession } from "next-auth/react";

type LeaveButtonProps = {
  players: Player[];
  matchId: string;
};

function isValidLeave(userName: string | undefined | null, players: Player[]) {
  if (!userName) return true;
  return !players.some((player) => player.discordId === userName);
}

export default function LeaveButton({ players, matchId }: LeaveButtonProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const disabled = isValidLeave(userName, players);
  function handleLeave() {
    const url = getApiUrl();
    if (isValidLeave(userName, players)) return;
    fetch(url + "/api/matches", {
      method: "POST",
      body: JSON.stringify({
        action: "removePlayer",
        matchId,
        playerId: userName,
      }),
    }).then(() => {
      updateMatchAction();
    });
  }
  return (
    <Button disabled={disabled} onClick={handleLeave}>
      {"Leave"}
    </Button>
  );
}
