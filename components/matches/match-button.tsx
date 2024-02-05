"use client";
import { useSession } from "next-auth/react";
import JoinButton from "./join-button";
import LeaveButton from "./leave-button";
import { MatchStatus, Player } from "@/types/types";

type MatchButtonProps = {
  matchStatus: MatchStatus;
  teamSize: number;
  matchId: string;
  players?: Player[]; // Make players optional to handle undefined case
};

export default function MatchButton({
  teamSize,
  players = [],
  matchId,
  matchStatus,
}: MatchButtonProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name;
  //   const discordId = session?.token?.sub; // Retrieve Discord ID from the token

  const isJoinable = isValidJoin(userName, players, teamSize, matchStatus);
  const isLeavable = isValidLeave(userName, players);

  return isJoinable ? (
    <JoinButton matchId={matchId} userName={userName} />
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
  teamSize: number,
  matchStatus: string
) {
  if (!userName) {
    return false;
  } else if (teamSize * 2 === players.length) {
    return false;
  } else if (matchStatus !== "queue") {
    return false;
  } else if (players.some((player) => player.userName === userName)) {
    return false;
  } else {
    return true;
  }
}
