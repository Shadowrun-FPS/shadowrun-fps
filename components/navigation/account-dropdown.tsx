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
import { deduplicatedFetch } from "@/lib/request-deduplication";
import { safeLog } from "@/lib/security";

interface UserData {
  permissions: {
    isAdmin: boolean;
    isModerator: boolean;
    canCreateTournament: boolean;
    isDeveloper: boolean;
  };
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
  teams: {
    captainTeams: any[];
    memberTeams: any[];
  };
}

export default function AccountDropdown() {
  const { data: session, status } = useSession();
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [userRoleDisplay, setUserRoleDisplay] = useState<UserRoleInfo[]>([]);
  const [guildNickname, setGuildNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const { unreadCount } = useNotifications();
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
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
          setDiscordUsername(userData.player?.discordUsername || null);

          // Process teams
          const allTeams: any[] = [];
          const captainTeamIds = new Set(
            (userData.teams.captainTeams || []).map(
              (t: any) => t._id?.toString() || t.id
            )
          );

          // Add captain teams
          if (userData.teams.captainTeams && Array.isArray(userData.teams.captainTeams)) {
            userData.teams.captainTeams.forEach((team: any) => {
              const teamId = team._id?.toString() || team.id;
              allTeams.push({
                id: teamId,
                name: team.name,
                tag: team.tag,
                isCaptain: true,
              });
            });
          }

          // Add member teams (excluding duplicates where user is already captain)
          if (userData.teams.memberTeams && Array.isArray(userData.teams.memberTeams)) {
            userData.teams.memberTeams.forEach((team: any) => {
              const teamId = team._id?.toString() || team.id;
              if (!captainTeamIds.has(teamId)) {
                allTeams.push({
                  id: teamId,
                  name: team.name,
                  tag: team.tag,
                  isCaptain: false,
                });
              }
            });
          }

          setUserTeams(allTeams);
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
  const teamsEnabled = isFeatureEnabled("teams");

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
      {/* Notifications button - hidden on small screens (shown in dropdown instead) */}
      <Link
        href="/notifications"
        className="relative hidden md:inline-flex"
      >
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg hover:bg-accent transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white shadow-lg border-2 border-background animate-pulse">
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
            className="flex relative gap-2.5 items-center px-2.5 py-1.5 h-auto rounded-lg hover:bg-accent transition-colors group"
          >
            <Avatar className="w-8 h-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline max-w-[140px] truncate text-sm font-medium">
              {/* Use guild nickname instead of global username */}
              {guildNickname || session?.user?.nickname}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <div className="flex flex-col p-3.5 pb-3 space-y-2.5 rounded-lg bg-muted/30 -m-0.5 mb-0">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-primary/10 shadow-sm">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="font-medium text-sm truncate text-foreground">
                  {/* Use guild nickname instead of global username */}
                  {guildNickname || session?.user?.nickname}
                </p>
              </div>
            </div>
            {userRoleDisplay.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
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

          {/* Notifications - only on small screens (navbar shows bell on md+) */}
          <div className="md:hidden">
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="flex items-center cursor-pointer relative"
              >
                <Bell className="mr-2 w-4 h-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          </div>

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

          {/* Teams section - only when teams feature is enabled */}
          {teamsEnabled &&
            (userTeams.length === 0 ? (
              <DropdownMenuItem asChild>
                <Link
                  href="/tournaments/teams"
                  className="flex items-center cursor-pointer"
                >
                  <Users className="mr-2 w-4 h-4" />
                  Find Team
                </Link>
              </DropdownMenuItem>
            ) : userTeams.length === 1 ? (
              <DropdownMenuItem asChild>
                <Link
                  href={`/tournaments/teams/${userTeams[0].id}`}
                  className="flex items-center cursor-pointer"
                >
                  <Users className="mr-2 w-4 h-4" />
                  My Team
                </Link>
              </DropdownMenuItem>
            ) : (
              <>
                {userTeams.map((team) => (
                  <DropdownMenuItem key={team.id} asChild>
                    <Link
                      href={`/tournaments/teams/${team.id}`}
                      className="flex items-center justify-between cursor-pointer min-w-0"
                    >
                      <span className="truncate">
                        {team.tag ? `[${team.tag}] ` : ""}
                        {team.name}
                      </span>
                      {team.isCaptain && (
                        <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                          Captain
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link
                    href="/tournaments/teams"
                    className="flex items-center cursor-pointer text-muted-foreground"
                  >
                    <Users className="mr-2 w-4 h-4" />
                    Browse All Teams
                  </Link>
                </DropdownMenuItem>
              </>
            ))}

          {/* Admin link - show if user has admin, moderator, founder roles or is developer */}
          {(hasModAccess() || isDeveloper()) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center cursor-pointer">
                  <Shield className="mr-2 w-4 h-4" />
                  Admin
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
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
