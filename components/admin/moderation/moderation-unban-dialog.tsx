"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { unbanTypedNameMatches } from "@/hooks/useModerationData";
import type { UnbanConfirmPayload } from "@/types/moderation";

const unbanActionClassName =
  "gap-2 border border-privileged/80 bg-privileged text-privileged-foreground shadow-sm hover:bg-privileged/88 hover:text-privileged-foreground";

interface ModerationUnbanDialogProps {
  unbanConfirm: UnbanConfirmPayload | null;
  unbanTypedPlayerName: string;
  unbanInProgressId: string | null;
  setUnbanConfirm: (v: UnbanConfirmPayload | null) => void;
  setUnbanTypedPlayerName: (v: string) => void;
  performUnban: () => Promise<void>;
}

export function ModerationUnbanDialog({
  unbanConfirm,
  unbanTypedPlayerName,
  unbanInProgressId,
  setUnbanConfirm,
  setUnbanTypedPlayerName,
  performUnban,
}: ModerationUnbanDialogProps) {
  return (
    <AlertDialog
      open={!!unbanConfirm}
      onOpenChange={(open) => {
        if (!open && unbanInProgressId === null) setUnbanConfirm(null);
      }}
    >
      <AlertDialogContent className="max-w-[min(100vw-2rem,28rem)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this ban?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                This restores access for{" "}
                <span className="font-medium text-foreground">
                  {unbanConfirm?.playerName ?? "this player"}
                </span>
                . The unban is recorded in the moderation log.
              </p>
              {unbanConfirm?.durationLabel ? (
                <p>
                  <span className="font-medium text-foreground">Ban duration: </span>
                  {unbanConfirm.durationLabel}
                </p>
              ) : null}
              {unbanConfirm?.reason ? (
                <p className="min-w-0">
                  <span className="font-medium text-foreground">Original reason: </span>
                  <span className="line-clamp-4 break-words">{unbanConfirm.reason}</span>
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {unbanConfirm ? (
          <div className="space-y-2">
            <Label
              htmlFor="moderation-unban-confirm-name"
              className="text-left text-sm font-medium text-foreground"
            >
              Type the player name to confirm
            </Label>
            <Input
              id="moderation-unban-confirm-name"
              name="unban-confirm-player-name"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={unbanTypedPlayerName}
              onChange={(e) => setUnbanTypedPlayerName(e.target.value)}
              placeholder="Match spelling and spacing exactly"
              disabled={unbanInProgressId !== null}
              className="font-mono text-sm"
              autoFocus
              aria-invalid={
                unbanTypedPlayerName.length > 0 &&
                !unbanTypedNameMatches(unbanTypedPlayerName, unbanConfirm.playerName)
              }
            />
            <p className="text-xs text-muted-foreground">
              Must match exactly (case-sensitive). This reduces mistaken unbans on busy rosters.
            </p>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={unbanInProgressId !== null}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={
              unbanInProgressId !== null ||
              !unbanConfirm ||
              !unbanTypedNameMatches(unbanTypedPlayerName, unbanConfirm.playerName)
            }
            className={cn(unbanActionClassName)}
            onClick={(e) => {
              e.preventDefault();
              void performUnban();
            }}
          >
            {unbanInProgressId !== null ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                Unbanning…
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 shrink-0" />
                Confirm unban
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
