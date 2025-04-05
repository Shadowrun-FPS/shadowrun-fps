"use client";

import React, { useEffect, useState } from "react";
import Spinner from "@/components/util/spinner";
import { IconDiscordLogo } from "../icons/discord-logo";
import { signIn, signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import Link from "next/link";
import { Bell, Shield } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { getTestRoles } from "@/lib/auth-helpers";

export default function AccountDropdown() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session;
  const [isBanned, setIsBanned] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  // Check if the user has mod access
  const hasModAccess = () => {
    if (!session?.user) return false;

    // User has explicit mod role or is specific user
    if (session.user.id === "238329746671271936") return true;

    const modRoleIds = [
      "932585751332421642", // Admin
      "1095126043918082109", // Founder
      "1042168064805965864", // Mod
      "1080979865345458256", // GM
    ];

    const userRoles = getTestRoles(session.user.id);
    return userRoles.some((role: string) => modRoleIds.includes(role));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetch("/api/player/ban-status")
        .then((res) => res.json())
        .then((data) => {
          if (data.isBanned) {
            setIsBanned(true);
          }
        })
        .catch((err) => {
          console.error("Error fetching ban status:", err);
        });
    }
  }, [isLoggedIn]);

  const handleSignIn = () => {
    try {
      signIn("discord", { callbackUrl: "/" }).catch((err) => {
        console.error("Sign-in error:", err);
      });
    } catch (error) {
      console.error("Sign-in exception:", error);
    }
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

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative border rounded-full h-9 w-9 border-primary/10"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || "User"}
              />
              <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-0.5 leading-none">
              <p className="font-medium">
                {session?.user.nickname || session?.user.name}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/notifications" className="flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </Link>
          </DropdownMenuItem>

          {session?.user.roles?.includes("admin") ||
          session?.user.roles?.includes("moderator") ? (
            <DropdownMenuItem asChild>
              <Link href="/admin/moderation" className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span>Mod Panel</span>
              </Link>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              event.preventDefault();
              handleSignOut();
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
