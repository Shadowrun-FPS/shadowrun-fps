"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/util/spinner";

import IconDiscordLogo from "../icons/discord-logo";
import { signIn, signOut } from "next-auth/react";

import { useSession } from "next-auth/react";

const DiscordSignIn: React.FC = () => {
  const { status } = useSession();

  const handleSignIn = () => {
    console.log("Discord sign in");
    signIn("discord");
  };

  const handleSignOut = () => {
    console.log("Discord sign out");
    signOut();
  };

  if (status === "loading") {
    return <Spinner />;
  } else if (status === "authenticated") {
    return (
      <Button
        className={"gap-2 min-w-fit bg-red-500"}
        variant="outline"
        onClick={handleSignOut}
      >
        <IconDiscordLogo height={"2em"} width={"2em"} />
        <span className="hidden md:block">Sign out</span>
      </Button>
    );
  } else {
    return (
      <Button
        className={"gap-2 min-w-fit bg-discord"}
        variant="outline"
        onClick={handleSignIn}
      >
        <IconDiscordLogo height={"2em"} width={"2em"} />
        <span className="hidden md:block">Sign in</span>
      </Button>
    );
  }
};

export default DiscordSignIn;
