"use client";
import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";
import { Player } from "@/types/types";
import { useSession } from "next-auth/react";

type LeaveButtonProps = {
  disabled: boolean;
  matchId: string;
};

export default function LeaveButton({ disabled, matchId }: LeaveButtonProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name;

  function handleLeave() {
    const url = getApiUrl();
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
