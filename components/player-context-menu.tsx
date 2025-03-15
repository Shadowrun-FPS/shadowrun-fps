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
import { AlertTriangle, Ban, History, Shield } from "lucide-react";
import { ModerationDialog } from "@/components/moderation-dialog";
import { Player, ModerationActionType } from "@/types/moderation";

interface PlayerContextMenuProps {
  children: React.ReactNode;
  player: Player;
  disabled?: boolean;
}

export function PlayerContextMenu({
  children,
  player,
  disabled = false,
}: PlayerContextMenuProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] =
    useState<ModerationActionType | null>(null);

  // Check if user has mod access
  const hasModAccess =
    session?.user?.id === "238329746671271936" || // Your ID
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
        <ContextMenuContent className="w-64 bg-popover border border-border shadow-lg">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            Player Actions
          </div>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleModeration("warn")}
            className="cursor-pointer flex items-center gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-50"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Issue Warning</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleModeration("ban")}
            className="cursor-pointer flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
          >
            <Ban className="h-4 w-4" />
            <span>{player.isBanned ? "Update Ban" : "Ban Player"}</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleViewHistory}
            className="cursor-pointer flex items-center gap-2 text-indigo-600 focus:text-indigo-600 focus:bg-indigo-50"
          >
            <History className="h-4 w-4" />
            <span>View Player History</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleViewModPanel}
            className="cursor-pointer flex items-center gap-2 text-blue-600 focus:text-blue-600 focus:bg-blue-50"
          >
            <Shield className="h-4 w-4" />
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
