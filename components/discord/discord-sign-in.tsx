"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/util/spinner";
import IconDiscordLogo from "../icons/discord-logo";
import { signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

const DiscordSignIn: React.FC = () => {
  const { data: session, status } = useSession();

  const handleSignIn = () => {
    console.log("Discord sign in");
    signIn("discord");
  };

  const handleSignOut = () => {
    console.log("Discord sign out");
    signOut();
  };

  let avatarSrc = "";
  if (status === "loading") {
    return <Spinner />;
  } else if (status === "authenticated" && session) {
    // Check if user data exists in session
    const { user } = session;
    if (user && user.image) {
      // If user has a profile image, use it as the avatar source
      avatarSrc = user.image;
    }
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{user.name}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button
                className={"gap-2 min-w-fit bg-red-500"}
                variant="outline"
                onClick={handleSignOut}
              >
                <IconDiscordLogo height={"2em"} width={"2em"} />
                <span className="hidden md:block">Sign out</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
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
