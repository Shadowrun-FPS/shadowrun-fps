"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserPermissions, UserRoleInfo } from "@/lib/client-config";
import { deduplicatedFetch } from "@/lib/request-deduplication";
import { safeLog } from "@/lib/security";

interface UserData {
  permissions: UserPermissions;
  roles: string[];
  guildNickname: string | null;
  roleDisplay: Array<{
    roleId: string;
    roleName: string;
    color: string;
  }>;
  player: {
    discordId: string;
    discordUsername: string;
    discordNickname?: string;
    discordProfilePicture?: string;
  } | null;
}

export default function AccountDropdown() {
  const { data: session, status } = useSession();
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [userRoleDisplay, setUserRoleDisplay] = useState<UserRoleInfo[]>([]);
  const [guildNickname, setGuildNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchUserDataRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Fetch user data when session is available - using unified endpoint
  useEffect(() => {
    // Prevent duplicate calls from React StrictMode
    const currentUserId = session?.user?.id ?? null;

    // If user ID changed, reset the ref
    if (lastUserIdRef.current !== currentUserId) {
      fetchUserDataRef.current = false;
      lastUserIdRef.current = currentUserId;
    }

    if (fetchUserDataRef.current || !currentUserId) {
      return;
    }

    fetchUserDataRef.current = true;

    const fetchUserData = async () => {
      if (session?.user) {
        setIsLoading(true);
        try {
          // ✅ NEW: Single unified API call with deduplication
          const userData = await deduplicatedFetch<UserData>("/api/user/data", {
            ttl: 60000, // Cache for 1 minute
          });

          // Set all state from single response
          setUserPermissions(userData.permissions);
          // Map roleDisplay to match UserRoleInfo type (id/name instead of roleId/roleName)
          setUserRoleDisplay(
            userData.roleDisplay.map((role) => ({
              id: role.roleId,
              name: role.roleName,
              color: role.color,
            }))
          );
          setGuildNickname(
            userData.guildNickname ||
              session.user.nickname ||
              session.user.name ||
              null
          );
        } catch (error) {
          // If API fails, use fallback data from session
          const fallbackName =
            session.user.nickname || session.user.name || null;
          setGuildNickname(fallbackName);
          safeLog.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [session?.user?.id, session?.user]); // Only refetch when user ID changes

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };


  // Display login button if not authenticated (Rumble-style pill outline)
  if (status === "unauthenticated") {
    return (
      <Button
        variant="outline"
        onClick={() => signIn("discord")}
        className="flex gap-1.5 items-center rounded-full h-8 sm:h-9 px-3 text-sm font-medium touch-manipulation border border-border/60 bg-transparent hover:bg-accent hover:border-border"
      >
        <IconDiscordLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Sign in
      </Button>
    );
  }

  // Display loading spinner while checking authentication
  if (status === "loading" || isLoading) {
    return <Spinner size="sm" />;
  }

  // Display user account dropdown when authenticated
  return (
    <div className="flex gap-1.5 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="group relative flex h-auto items-center gap-2.5 rounded-full border border-border/40 bg-muted/25 px-2 py-1 pr-2.5 transition-colors hover:bg-muted/45 hover:border-border/60"
          >
            <Avatar className="h-8 w-8 ring-2 ring-transparent transition-all group-hover:ring-primary/15">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground md:inline">
              {guildNickname || session?.user?.nickname}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[min(17rem,calc(100vw-1.5rem))] p-1.5"
          sideOffset={8}
        >
          {userRoleDisplay.length > 0 && (
            <>
              <div className="mb-1 rounded-xl border border-border/40 bg-muted/25 px-3 py-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {userRoleDisplay.map((role) => (
                    <Badge
                      key={role.id}
                      className={`text-white ${role.color} px-2 py-0.5 text-xs font-semibold`}
                    >
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator className="my-1 bg-border/60" />
            </>
          )}

          <DropdownMenuItem
            className="cursor-pointer gap-3 rounded-xl py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              handleSignOut();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
