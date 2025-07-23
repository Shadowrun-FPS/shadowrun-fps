"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AlertTriangle, Ban, History, Shield, User } from "lucide-react";
import { ModerationDialog } from "@/components/moderation-dialog";
import { Player, ModerationActionType } from "@/types/moderation";
import Link from "next/link";
import { SECURITY_CONFIG } from "@/lib/security-config";

export interface PlayerContextMenuProps {
  player: Player;
  children: React.ReactNode;
  disabled?: boolean;
  showRank?: boolean;
}

export function PlayerContextMenu({
  children,
  player,
  disabled = false,
  showRank = true,
}: PlayerContextMenuProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] =
    useState<ModerationActionType | null>(null);

  // Check if user has mod access
  const hasModAccess =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session?.user?.roles &&
      (session?.user?.roles.includes("admin") ||
        session?.user?.roles.includes("moderator") ||
        session?.user?.roles.includes("founder")));

  if (!hasModAccess || disabled) {
    return <>{children}</>;
  }

  const handleModeration = (action: ModerationActionType) => {
    setModerationAction(action);
    setDialogOpen(true);
  };

  const handleViewHistory = () => {
    router.push(`/admin/players/${player._id}/history`);
  };

  const handleViewModPanel = () => {
    router.push("/admin/players");
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64 border shadow-lg bg-popover border-border">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            Player Actions
          </div>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleModeration("warn")}
            className="flex gap-2 items-center text-amber-600 cursor-pointer focus:text-amber-600 focus:bg-amber-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Issue Warning</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleModeration("ban")}
            className="flex gap-2 items-center text-rose-600 cursor-pointer focus:text-rose-600 focus:bg-rose-50"
          >
            <Ban className="w-4 h-4" />
            <span>{player.isBanned ? "Update Ban" : "Ban Player"}</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleViewHistory}
            className="flex gap-2 items-center text-indigo-600 cursor-pointer focus:text-indigo-600 focus:bg-indigo-50"
          >
            <History className="w-4 h-4" />
            <span>View Player History</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleViewModPanel}
            className="flex gap-2 items-center text-blue-600 cursor-pointer focus:text-blue-600 focus:bg-blue-50"
          >
            <Shield className="w-4 h-4" />
            <span>View Mod Panel</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {dialogOpen && moderationAction && (
        <ModerationDialog
          player={player}
          action={moderationAction}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
}
