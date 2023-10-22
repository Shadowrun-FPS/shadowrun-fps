"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import IconDiscordLogo from "../logos/discord-logo";
import { signIn, signOut } from "next-auth/react";

import { useSession } from "next-auth/react";

const DiscordSignIn: React.FC = () => {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  const handleSignIn = () => {
    console.log("Discord sign in");
    signIn("discord");
  };

  const handleSignOut = () => {
    console.log("Discord sign out");
    signOut();
  };

  return (
    <Button
      className={`gap-2 min-w-fit ${isSignedIn ? "bg-red-500" : "bg-discord"}`}
      variant="outline"
      onClick={isSignedIn ? handleSignOut : handleSignIn}
    >
      <IconDiscordLogo height={"2em"} width={"2em"} />
      {isSignedIn ? "Sign out" : "Sign in"}
    </Button>
  );
};

export default DiscordSignIn;
