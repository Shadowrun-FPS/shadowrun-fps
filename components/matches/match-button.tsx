"use client";
import { useSession } from "next-auth/react";
import JoinButton from "./join-button";
import LeaveButton from "./leave-button";
import { Player } from "@/types/types";
import { userAgent } from "next/server";

type MatchButtonProps = {
  teamSize: number;
  matchId: string;
  players?: Player[]; // Make players optional to handle undefined case
};

export default function MatchButton({
  teamSize,
  players = [],
  matchId,
}: MatchButtonProps) {
  const { data: session } = useSession();
  console.log({ session });
  const userName = session?.user?.name;
  //   const discordId = session?.token?.sub; // Retrieve Discord ID from the token

  const isJoinable = isValidJoin(userName, players, teamSize);
  const isLeavable = isValidLeave(userName, players);

  return isJoinable ? (
    <JoinButton matchId={matchId} />
  ) : (
    <LeaveButton matchId={matchId} disabled={!isLeavable} />
  );
}

function isValidLeave(userName: string | undefined | null, players: Player[]) {
  if (!userName) return true;
  return !players.some((player) => player.playerId === userName);
}

function isValidJoin(
  userName: string | undefined | null,
  players: Player[],
  teamSize: number
) {
  //   console.log({ userName, players, teamSize });
  if (!userName) {
    return false;
  } else if (teamSize * 2 === players.length) {
    return false;
  } else if (status !== "queue") {
    return false;
  } else if (players.some((player) => player.playerId === userName)) {
    return false;
  } else {
    return true;
  }
}
