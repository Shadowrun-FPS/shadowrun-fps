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
import { SECURITY_CONFIG } from "@/lib/security-config";

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
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
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
          className="flex gap-2 items-center opacity-50 cursor-not-allowed"
          // onClick will be implemented later
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span>Issue Warning</span>
        </ContextMenuItem>
        <ContextMenuItem
          className="flex gap-2 items-center opacity-50 cursor-not-allowed"
          // onClick will be implemented later
        >
          <Ban className="w-4 h-4 text-red-500" />
          <span>Ban Player</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
