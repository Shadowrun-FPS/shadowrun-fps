"use client";

import React, { useEffect, useState } from "react";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { NotificationBadge } from "@/components/notification-badge";
import { Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function AccountDropdown() {
  const { data: session, status } = useSession();
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setNotifications(data);
      setPendingCount(data.filter((n: any) => n.status === "PENDING").length);
    };

    if (session) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Function to get role display name
  const getRoleDisplayName = (roleId: string) => {
    switch (roleId) {
      case "932585751332421642":
        return "Admin";
      case "1095126043918082109":
        return "Founder";
      case "1042168064805965864":
        return "Mod";
      case "1080979865345458256":
        return "GM";
      default:
        return null;
    }
  };

  // Temporary: Add test roles for specific Discord ID
  const getTestRoles = (userId: string) => {
    if (userId === "238329746671271936") {
      return [
        "932585751332421642", // Admin
      ];
    }
    return session?.user?.roles || [];
  };

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
  if (!session) {
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

  // Add these role-specific styles
  const getRoleBadgeStyle = (roleId: string) => {
    switch (roleId) {
      case "932585751332421642": // Admin
        return "bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20";
      case "1095126043918082109": // Founder
        return "bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 border-purple-500/20";
      case "1042168064805965864": // Mod
        return "bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20";
      case "1080979865345458256": // GM
        return "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20";
      default:
        return "";
    }
  };

  // Show dropdown when logged in
  return (
    <div className="flex items-center gap-4">
      <Link href="/notifications" className="relative">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {pendingCount}
            </span>
          )}
        </Button>
      </Link>

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

        <DropdownMenuContent align="end" className="w-56 p-2 mt-2">
          {/* Roles Section - Enhanced styling */}
          {session?.user && (
            <>
              <div className="px-2 py-1.5">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Roles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getTestRoles(session.user.id).map((roleId) => {
                    const roleName = getRoleDisplayName(roleId);
                    if (!roleName) return null;

                    return (
                      <Badge
                        key={roleId}
                        variant="secondary"
                        className={`text-[10px] font-medium px-2 py-0.5 ${getRoleBadgeStyle(
                          roleId
                        )}`}
                      >
                        {roleName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Separator className="my-2" />
            </>
          )}

          {/* Notifications Section - Enhanced styling */}
          <div className="px-2 py-1.5">
            <Link href="/notifications" className="block">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Notifications</span>
                </div>
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {pendingCount} new
                  </Badge>
                )}
              </div>
              {notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications
                    .filter((n) => n.status === "PENDING")
                    .slice(0, 2)
                    .map((notification) => (
                      <div
                        key={notification._id}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          {notification.type === "TEAM_INVITE" && "👥"}
                          {notification.type === "MATCH_READY" && "🎮"}
                          {notification.type === "MATCH_COMPLETE" && "🏆"}
                          <span className="truncate">
                            {notification.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  {pendingCount > 2 && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      +{pendingCount - 2} more notifications
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  No new notifications
                </div>
              )}
            </Link>
          </div>
          <Separator className="my-2" />

          {/* Sign Out Section */}
          <DropdownMenuItem
            className="flex items-center justify-center gap-2 text-sm"
            onClick={handleSignOut}
          >
            <IconDiscordLogo className="w-3.5 h-3.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
