"use client";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/types";
import { useSession } from "next-auth/react";

type JoinButtonProps = {
  isMatchFull: boolean;
};

export default function JoinButton({ isMatchFull }: JoinButtonProps) {
  const { data: session } = useSession();

  function handleJoin() {
    console.log("handleJoin", session);
  }
  return (
    <Button disabled={isMatchFull} onClick={handleJoin}>
      {isMatchFull ? "Full" : "Join"}
    </Button>
  );
}
