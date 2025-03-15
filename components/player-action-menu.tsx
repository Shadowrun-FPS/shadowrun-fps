"use client";

import React, { useState } from "react";
import { MoreHorizontal, Ban, AlertTriangle, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { WarnPlayerDialog } from "@/components/warn-player-dialog";
import { BanPlayerDialog } from "@/components/ban-player-dialog";
import { IssueWarningDialog } from "@/components/issue-warning-dialog";

interface PlayerActionMenuProps {
  player: {
    id: string;
    name: string;
  };
  onActionComplete?: () => void;
}

export function PlayerActionMenu({
  player,
  onActionComplete,
}: PlayerActionMenuProps) {
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setWarnDialogOpen(true)}>
            <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
            Issue Warning
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
            <Ban className="mr-2 h-4 w-4 text-red-500" />
            Ban Player
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Flag className="mr-2 h-4 w-4" />
            Report Player
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Use our updated warning dialog with required reason */}
      <IssueWarningDialog
        open={warnDialogOpen}
        onOpenChange={setWarnDialogOpen}
        playerId={player.id}
        playerName={player.name}
        onComplete={() => {
          if (onActionComplete) onActionComplete();
        }}
      />

      <BanPlayerDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        playerId={player.id}
        playerName={player.name}
        onBanComplete={() => {
          if (onActionComplete) onActionComplete();
        }}
      />
    </>
  );
}
