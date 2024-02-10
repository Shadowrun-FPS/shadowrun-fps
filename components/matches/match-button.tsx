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
  const discordId = session?.user.id;
  const discordNickname =
    session?.user.guild.nick ?? session?.user.global_name ?? session?.user.name;
  console.log({ discordId, discordNickname });
  const isJoinable = isValidJoin(discordId, players, teamSize, matchStatus);
  const isLeavable = isValidLeave(discordId, players);

  return isJoinable ? (
    <JoinButton
      matchId={matchId}
      discordId={discordId}
      discordNickname={discordNickname}
    />
  ) : (
    <LeaveButton
      matchId={matchId}
      disabled={!isLeavable}
      discordId={discordId}
    />
  );
}

function isValidLeave(discordId: string | undefined | null, players: Player[]) {
  if (!discordId) return true;
  return !players.some((player) => player.discordId === discordId);
}

function isValidJoin(
  discordId: string | undefined | null,
  players: Player[],
  teamSize: number,
  matchStatus: string
) {
  if (!discordId) {
    return false;
  } else if (teamSize * 2 === players.length) {
    return false;
  } else if (matchStatus !== "queue") {
    return false;
  } else if (players.some((player) => player.discordId === discordId)) {
    return false;
  } else {
    return true;
  }
}
