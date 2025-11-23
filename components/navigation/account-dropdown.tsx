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
import Link from "next/link";
import { Bell, Shield, Users, BarChart2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { Badge } from "@/components/ui/badge";
import { isFeatureEnabled } from "@/lib/features";
import { UserPermissions, UserRoleInfo } from "@/lib/client-config";

export default function AccountDropdown() {
  const { data: session, status } = useSession();
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [userRoleDisplay, setUserRoleDisplay] = useState<UserRoleInfo[]>([]);
  const [guildNickname, setGuildNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const { unreadCount } = useNotifications();
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const fetchUserDataRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Fetch user data when session is available
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
          // Fetch user permissions and role display information
          const [permissionsResponse, roleDisplayResponse] = await Promise.all([
            fetch("/api/user/permissions").catch(
              () => ({ ok: false, status: 429 } as Response)
            ),
            fetch("/api/user/role-display").catch(
              () => ({ ok: false, status: 429 } as Response)
            ),
          ]);

          if (
            permissionsResponse instanceof Response &&
            permissionsResponse.ok &&
            permissionsResponse.status !== 429
          ) {
            const permissionsData = await permissionsResponse.json();
            setUserPermissions(permissionsData);
          } else if (
            permissionsResponse instanceof Response &&
            permissionsResponse.status === 429
          ) {
            // Rate limited - skip gracefully
            console.warn("Rate limited on permissions fetch");
          }

          if (
            roleDisplayResponse instanceof Response &&
            roleDisplayResponse.ok &&
            roleDisplayResponse.status !== 429
          ) {
            const roleDisplayData = await roleDisplayResponse.json();
            const roles = roleDisplayData.roles || [];
            setUserRoleDisplay(roles);

            // Set the guild nickname from the API response
            const nickname =
              roleDisplayData.guildNickname ||
              session.user.nickname ||
              session.user.name ||
              null;
            setGuildNickname(nickname);
          } else if (
            roleDisplayResponse instanceof Response &&
            roleDisplayResponse.status === 429
          ) {
            // Rate limited - use fallback
            console.warn("Rate limited on role display fetch");
            const fallbackName =
              session.user.nickname || session.user.name || null;
            setGuildNickname(fallbackName);
          } else {
            // Fallback: Just use session data if role display fails
            const fallbackName =
              session.user.nickname || session.user.name || null;
            setGuildNickname(fallbackName);
          }

          // Get the user's Discord username for profile link
          try {
            const playerResponse = await fetch(
              `/api/players/${session.user.id}`
            );
            if (playerResponse.ok && playerResponse.status !== 429) {
              const playerData = await playerResponse.json();
              setDiscordUsername(playerData.discordUsername || null);
            } else if (playerResponse.status === 429) {
              console.warn("Rate limited on player fetch");
            }
          } catch (error) {
            // Skip on error
          }

          // Check if user has a team
          try {
            const teamsResponse = await fetch("/api/teams/user");
            if (teamsResponse.ok && teamsResponse.status !== 429) {
              const teamsData = await teamsResponse.json();
              setUserTeam(teamsData.team || null);
            } else if (teamsResponse.status === 429) {
              console.warn("Rate limited on teams fetch");
            }
          } catch (error) {
            // Skip on error
          }
        } catch (error) {
          // If API fails, use nickname from session
          const fallbackName =
            session.user.nickname || session.user.name || null;
          setGuildNickname(fallbackName);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [session?.user?.id, session?.user]); // Only refetch when user ID changes

  // Check permissions using server response
  const hasModAccess = (): boolean => {
    return userPermissions?.isModerator || userPermissions?.isAdmin || false;
  };

  const hasAdminAccess = (): boolean => {
    return userPermissions?.isAdmin || false;
  };

  const hasModeratorAccess = (): boolean => {
    return userPermissions?.isModerator || false;
  };

  const isDeveloper = (): boolean => {
    return userPermissions?.isDeveloper || false;
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Check if player stats is enabled
  const playerStatsEnabled = isFeatureEnabled("playerStats");

  // Display login button if not authenticated
  if (status === "unauthenticated") {
    return (
      <Button
        onClick={() => signIn("discord")}
        className="flex gap-2 items-center"
      >
        <IconDiscordLogo className="w-4 h-4" />
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
    <div className="flex gap-2 items-center">
      {/* Notifications button */}
      <Link href="/notifications" className="relative">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </Link>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex relative gap-2 items-center px-2 py-1 h-auto rounded-full"
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline max-w-[140px] truncate text-sm">
              {/* Use guild nickname instead of global username */}
              {guildNickname || session?.user?.nickname}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col p-2 space-y-1">
            <p className="font-medium">
              {/* Use guild nickname instead of global username */}
              {guildNickname || session?.user?.nickname}
            </p>
            {userRoleDisplay.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {userRoleDisplay.map((role) => (
                  <Badge
                    key={role.id}
                    className={`text-white ${role.color} text-xs font-semibold px-2 py-0.5`}
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Only show Player Stats link if feature is enabled */}
          {playerStatsEnabled && (
            <DropdownMenuItem asChild>
              <Link
                href={
                  discordUsername
                    ? `/player/stats?playerName=${discordUsername}`
                    : "/profile"
                }
                className="flex items-center cursor-pointer"
              >
                <BarChart2 className="mr-2 w-4 h-4" />
                Player Stats
              </Link>
            </DropdownMenuItem>
          )}

          {/* Link to team page if user has a team, otherwise show "Find Team" */}
          <DropdownMenuItem asChild>
            {userTeam ? (
              <Link
                href={`/tournaments/teams/${userTeam.id}`}
                className="flex items-center cursor-pointer"
              >
                <Users className="mr-2 w-4 h-4" />
                My Team
              </Link>
            ) : (
              <Link
                href="/tournaments/teams"
                className="flex items-center cursor-pointer"
              >
                <Users className="mr-2 w-4 h-4" />
                Find Team
              </Link>
            )}
          </DropdownMenuItem>

          {/* Admin link - show if user has admin, moderator, founder roles or is developer */}
          {(hasModAccess() || isDeveloper()) && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center cursor-pointer">
                <Shield className="mr-2 w-4 h-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
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
