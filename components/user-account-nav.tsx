"use client";

import { User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { Shield } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: Pick<User, "name" | "image" | "nickname">;
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  // Always call hooks at the top level - even if we return early later
  const { resetUnreadCount } = useNotifications();
  const hasReset = useRef(false);

  // Only reset once on mount, using a ref to track if we've already reset
  useEffect(() => {
    if (!hasReset.current) {
      hasReset.current = true;
      resetUnreadCount();
    }
  }, [resetUnreadCount]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <NotificationsDropdown />

      {process.env.NODE_ENV === "development" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetUnreadCount();
            // Force a refresh to ensure the UI updates
            window.location.reload();
          }}
          className="text-xs"
        >
          Reset Badge
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative w-8 h-8 rounded-full">
            <UserAvatar
              user={{
                name: user.name || null,
                image: user.image || null,
                nickname: user.nickname || null,
              }}
              className="w-8 h-8"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user.nickname && <p className="font-medium">{user.nickname}</p>}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/moderation">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span>Mod Panel</span>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              event.preventDefault();
              signOut({
                callbackUrl: `${window.location.origin}/login`,
              });
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
