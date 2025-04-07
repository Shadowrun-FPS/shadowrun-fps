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
import { Bell, Shield, Users, BarChart2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { Badge } from "@/components/ui/badge";

// Define the moderator role IDs and names with proper typing
interface RoleInfo {
  name: string;
  color: string;
}

interface RolesMap {
  [key: string]: RoleInfo;
}

// Define the moderator role IDs and names
const ROLES: RolesMap = {
  "932585751332421642": { name: "Admin", color: "bg-red-500" },
  "1095126043918082109": { name: "Founder", color: "bg-purple-500" },
  "1042168064805965864": { name: "Mod", color: "bg-blue-500" },
  "1080979865345458256": { name: "GM", color: "bg-green-500" },
};

// Developer ID for special permissions
const DEVELOPER_ID = "238329746671271936";

export default function AccountDropdown() {
  const { data: session, status } = useSession();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [guildNickname, setGuildNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const { unreadCount } = useNotifications();
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);

  // Fetch user roles from Discord when session is available
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (session?.user) {
        setIsLoading(true);
        try {
          // Fetch user roles from our API
          const response = await fetch("/api/discord/user-roles");
          if (!response.ok) throw new Error("Failed to fetch user roles");

          const data = await response.json();

          setUserRoles(data.roles || []);

          // Set the guild nickname from the API response
          const nickname =
            data.guildNickname ||
            session.user.nickname ||
            session.user.name ||
            null;
          setGuildNickname(nickname);

          // Get the user's Discord username for profile link
          const playerResponse = await fetch(`/api/players/${session.user.id}`);
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            setDiscordUsername(playerData.discordUsername || null);
          }

          // Check if user has a team
          const teamsResponse = await fetch("/api/teams/user");
          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            setUserTeam(teamsData.team || null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // If API fails, use nickname from session
          const fallbackName =
            session.user.nickname || session.user.name || null;
          setGuildNickname(fallbackName);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserRoles();
  }, [session]);

  // Check if the user has mod access based on their roles
  const hasModAccess = () => {
    // Always grant access to this specific user ID (developer)
    if (session?.user?.id === DEVELOPER_ID) return true;

    // Check if user has any of the mod role IDs
    return userRoles.some((roleId) => Object.keys(ROLES).includes(roleId));
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Display login button if not authenticated
  if (status === "unauthenticated") {
    return (
      <Button
        onClick={() => signIn("discord")}
        className="flex items-center gap-2"
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
    <div className="flex items-center gap-2">
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
            className="relative flex items-center h-auto gap-2 px-2 py-1 rounded-full"
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
            <div className="flex flex-wrap gap-1">
              {userRoles.map(
                (roleId) =>
                  ROLES[roleId] && (
                    <Badge
                      key={roleId}
                      className={`text-white ${ROLES[roleId].color}`}
                    >
                      {ROLES[roleId].name}
                    </Badge>
                  )
              )}
              {session?.user?.id === DEVELOPER_ID && (
                <Badge variant="success" className="text-white">
                  Developer
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Link to player stats page instead of generic profile */}
          <DropdownMenuItem asChild>
            <Link
              href={
                discordUsername
                  ? `/player/stats?playerName=${discordUsername}`
                  : "/profile"
              }
              className="flex items-center cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Player Stats
            </Link>
          </DropdownMenuItem>

          {/* Link to team page if user has a team, otherwise show "Find Team" */}
          <DropdownMenuItem asChild>
            {userTeam ? (
              <Link
                href={`/tournaments/teams/${userTeam.id}`}
                className="flex items-center cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2" />
                My Team
              </Link>
            ) : (
              <Link
                href="/tournaments/teams"
                className="flex items-center cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2" />
                Find Team
              </Link>
            )}
          </DropdownMenuItem>

          {hasModAccess() && (
            <DropdownMenuItem asChild>
              <Link
                href="/admin/moderation"
                className="flex items-center cursor-pointer"
              >
                <Shield className="w-4 h-4 mr-2" />
                Mod Panel
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
