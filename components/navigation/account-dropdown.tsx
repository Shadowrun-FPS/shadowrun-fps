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
import { Bell, Shield, Users, BarChart2, LogOut } from "lucide-react";
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
          className="relative h-9 w-9 rounded-full border border-transparent text-muted-foreground transition-colors hover:border-border/50 hover:bg-muted/40 hover:text-foreground"
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

          <div className="md:hidden">
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="flex cursor-pointer items-center gap-3 rounded-xl py-2.5"
              >
                <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          </div>

          {playerStatsEnabled && (
            <DropdownMenuItem asChild>
              <Link
                href={
                  discordUsername
                    ? `/player/stats?playerName=${discordUsername}`
                    : "/profile"
                }
                className="flex cursor-pointer items-center gap-3 rounded-xl py-2.5"
              >
                <BarChart2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                Player Stats
              </Link>
            </DropdownMenuItem>
          )}

          {teamsEnabled &&
            (userTeams.length === 0 ? (
              <DropdownMenuItem asChild>
                <Link
                  href="/tournaments/teams"
                  className="flex cursor-pointer items-center gap-3 rounded-xl py-2.5"
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Find Team
                </Link>
              </DropdownMenuItem>
            ) : userTeams.length === 1 ? (
              <DropdownMenuItem asChild>
                <Link
                  href={`/tournaments/teams/${userTeams[0].id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl py-2.5"
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  My Team
                </Link>
              </DropdownMenuItem>
            ) : (
              <>
                {userTeams.map((team) => (
                  <DropdownMenuItem key={team.id} asChild>
                    <Link
                      href={`/tournaments/teams/${team.id}`}
                      className="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl py-2.5"
                    >
                      <span className="truncate">
                        {team.tag ? `[${team.tag}] ` : ""}
                        {team.name}
                      </span>
                      {team.isCaptain && (
                        <Badge
                          variant="secondary"
                          className="ml-2 shrink-0 text-xs"
                        >
                          Captain
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link
                    href="/tournaments/teams"
                    className="flex cursor-pointer items-center gap-3 rounded-xl py-2.5 text-muted-foreground"
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    Browse All Teams
                  </Link>
                </DropdownMenuItem>
              </>
            ))}

          {(hasModAccess() || isDeveloper()) && (
            <DropdownMenuItem asChild>
              <Link
                href="/admin"
                className="flex cursor-pointer items-center gap-3 rounded-xl py-2.5"
              >
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-1 bg-border/60" />

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
