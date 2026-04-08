"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2, Save, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ADMIN_QUEUE_DIALOG_BODY,
  ADMIN_QUEUE_DIALOG_DESC,
  ADMIN_QUEUE_DIALOG_FOOTER,
  ADMIN_QUEUE_DIALOG_HEADER,
  ADMIN_QUEUE_DIALOG_SHELL,
  ADMIN_QUEUE_DIALOG_TITLE,
  ADMIN_QUEUE_FIELD_LABEL,
} from "@/lib/admin-queue-dialog-styles";
import type {
  AdminQueuePlayerSearchHit,
  AdminQueueRecord,
} from "@/types/admin-queue";
import { AdminQueueDialogContextHeader } from "./admin-queue-dialog-context-header";

export interface AdminQueueBansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: AdminQueueRecord | null;
  playerSearch: string;
  onPlayerSearchChange: (value: string) => void;
  searchResults: AdminQueuePlayerSearchHit[];
  bannedPlayers: string[];
  setBannedPlayers: Dispatch<SetStateAction<string[]>>;
  bannedPlayersInfo: Record<
    string,
    { discordNickname?: string; discordUsername?: string }
  >;
  setBannedPlayersInfo: Dispatch<
    SetStateAction<
      Record<string, { discordNickname?: string; discordUsername?: string }>
    >
  >;
  savingBannedPlayers: boolean;
  onSave: () => Promise<void>;
}

export function AdminQueueBansDialog({
  open,
  onOpenChange,
  queue,
  playerSearch,
  onPlayerSearchChange,
  searchResults,
  bannedPlayers,
  setBannedPlayers,
  bannedPlayersInfo,
  setBannedPlayersInfo,
  savingBannedPlayers,
  onSave,
}: AdminQueueBansDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(ADMIN_QUEUE_DIALOG_SHELL, "sm:max-w-[500px]")}
      >
        <DialogHeader className={ADMIN_QUEUE_DIALOG_HEADER}>
          <DialogTitle className={ADMIN_QUEUE_DIALOG_TITLE}>
            Queue bans
          </DialogTitle>
          <DialogDescription className={ADMIN_QUEUE_DIALOG_DESC}>
            Block Discord accounts from this queue only. They can still use
            other queues. Bans follow the account across rejoins.
          </DialogDescription>
          {queue ? <AdminQueueDialogContextHeader queue={queue} /> : null}
        </DialogHeader>
        <div
          className={cn(ADMIN_QUEUE_DIALOG_BODY, "max-h-[min(65vh,32rem)]")}
        >
          <div className="space-y-2">
            <Label className={ADMIN_QUEUE_FIELD_LABEL}>Search players</Label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search by Discord ID or nickname..."
                value={playerSearch}
                onChange={(e) => onPlayerSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border/40 bg-muted/10">
                {searchResults
                  .filter(
                    (player) => !bannedPlayers.includes(player.discordId)
                  )
                  .map((player) => (
                    <div
                      key={player.discordId}
                      className="flex cursor-pointer items-center justify-between border-b border-border/30 p-2.5 last:border-0 hover:bg-muted/30"
                      onClick={() => {
                        if (!bannedPlayers.includes(player.discordId)) {
                          setBannedPlayers([
                            ...bannedPlayers,
                            player.discordId,
                          ]);
                          setBannedPlayersInfo({
                            ...bannedPlayersInfo,
                            [player.discordId]: {
                              discordNickname: player.discordNickname,
                              discordUsername: player.discordUsername,
                            },
                          });
                        }
                        onPlayerSearchChange("");
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {player.discordNickname ||
                            player.discordUsername ||
                            player.discordId}
                        </p>
                        {player.discordNickname ? (
                          <p className="text-xs text-muted-foreground">
                            {player.discordId}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-medium uppercase tracking-wide"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!bannedPlayers.includes(player.discordId)) {
                            setBannedPlayers([
                              ...bannedPlayers,
                              player.discordId,
                            ]);
                          }
                          onPlayerSearchChange("");
                        }}
                      >
                        Ban
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className={ADMIN_QUEUE_FIELD_LABEL}>
              Banned ({bannedPlayers.length})
            </Label>
            {bannedPlayers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/40 bg-muted/5 py-8 text-center text-sm text-muted-foreground">
                No bans for this queue.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-border/40 bg-muted/10">
                {bannedPlayers.map((discordId) => {
                  const playerInfo = bannedPlayersInfo[discordId];
                  const displayName =
                    playerInfo?.discordNickname ||
                    playerInfo?.discordUsername ||
                    discordId;
                  const hasNameInfo =
                    playerInfo?.discordNickname ||
                    playerInfo?.discordUsername;
                  return (
                    <div
                      key={discordId}
                      className="flex items-center justify-between border-b border-border/30 p-2.5 last:border-0 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {displayName}
                        </p>
                        {hasNameInfo ? (
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {discordId}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 shrink-0"
                        onClick={() => {
                          setBannedPlayers(
                            bannedPlayers.filter((id) => id !== discordId)
                          );
                          const next = { ...bannedPlayersInfo };
                          delete next[discordId];
                          setBannedPlayersInfo(next);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className={cn(ADMIN_QUEUE_DIALOG_FOOTER, "gap-2")}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void onSave()}
            disabled={savingBannedPlayers}
          >
            {savingBannedPlayers ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
