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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import Image from "next/image";

const AccountDropdown: React.FC = () => {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();
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
    let avatarSrc,
      user = undefined;
    if (session) {
      user = session.user;
      if (user && user.image) {
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
        <DropdownMenuContent className="grid grid-cols-[100px_1fr] gap-4 p-4 rounded-md bg-gradient-to-b from-muted/50 focus:shadow-md">
          <div className="flex items-center justify-center">
            <Image
              className="rounded-full shadow-lg dark:shadow-black/20"
              src="/teleport_2.gif"
              alt="Teleport GIF"
              width={80}
              height={80}
            />
          </div>

          <div>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
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
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
};

export default AccountDropdown;
