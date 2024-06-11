"use client";
import React, { useEffect } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

const AccountDropdown: React.FC = () => {
  const { data: session, status } = useSession();
  console.log("Discord sign in", session, status);
  const isLoggedIn = status === "authenticated";

  useEffect(() => {
    console.log("Account dropdown mounted");
  }, []);
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
  } else {
    // Check if user data exists in session
    let avatarSrc,
      user = undefined;
    if (session) {
      user = session.user;
      if (user && user.image) {
        // If user has a profile image, use it as the avatar source
        avatarSrc = user.image;
      }
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage src={avatarSrc} />
            <AvatarFallback>{<User />}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={"flex gap-2"}
            onClick={isLoggedIn ? handleSignOut : handleSignIn}
          >
            <IconDiscordLogo height={"2em"} width={"2em"} />
            {status === "authenticated" ? (
              <span>Sign out</span>
            ) : (
              <span>Sign In</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
};

export default AccountDropdown;
