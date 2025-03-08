"use client";

import { useSession } from "next-auth/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AlertTriangle, Ban } from "lucide-react";
import { ReactNode } from "react";

interface PlayerContextMenuProps {
  children: ReactNode;
  playerId: string;
  playerName: string;
}

export function PlayerContextMenu({
  children,
  playerId,
  playerName,
}: PlayerContextMenuProps) {
  const { data: session } = useSession();

  // Check if user has moderation permissions
  const hasModerationPermissions =
    session?.user?.id === "238329746671271936" || // Your ID - always allow
    (session?.user?.roles &&
      (session.user.roles.includes("admin") ||
        session.user.roles.includes("moderator") ||
        session.user.roles.includes("founder")));

  if (!hasModerationPermissions) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-[#1f2937] border-[#3b82f6] text-white">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">
          Moderation Actions
        </div>
        <ContextMenuSeparator className="bg-[#3b82f6]/30" />
        <ContextMenuItem
          className="flex items-center gap-2 cursor-not-allowed opacity-50"
          // onClick will be implemented later
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span>Issue Warning</span>
        </ContextMenuItem>
        <ContextMenuItem
          className="flex items-center gap-2 cursor-not-allowed opacity-50"
          // onClick will be implemented later
        >
          <Ban className="w-4 h-4 text-red-500" />
          <span>Ban Player</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
