"use client";

import React from "react";
import Spinner from "@/components/util/spinner";
import IconDiscordLogo from "../icons/discord-logo";
import { signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

export function AccountDropdown() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const handleSignIn = () => {
    signIn("discord");
  };

  const handleSignOut = () => {
    signOut();
  };

  if (status === "loading") {
    return <Spinner />;
  }

  // Show Discord Sign In button when not logged in
  if (!isLoggedIn) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignIn}
        className="w-8 h-8 transition-colors rounded-full hover:bg-accent"
      >
        <IconDiscordLogo className="w-5 h-5" />
      </Button>
    );
  }

  // Show dropdown when logged in
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 transition-all rounded-full hover:bg-accent"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={session.user?.image || undefined}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10">
              <IconDiscordLogo className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-2 mt-2 w-42">
        <DropdownMenuItem
          className="flex items-center justify-center gap-2 mt-2"
          onClick={handleSignOut}
        >
          <IconDiscordLogo className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
