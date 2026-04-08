"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Lock,
  MoreHorizontal,
  Trash2,
  Copy,
  UserMinus,
  MapPin,
  RefreshCw,
  X,
  Ban,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getQueueTierChip } from "@/lib/queue-tier-config";
import { normalizeDiscordSnowflakeList } from "@/lib/normalize-discord-snowflake";

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number;
}

interface Queue {
  _id: string;
  queueId: string;
  /** Display label for the queue (admin “Queue Name”, stored as `gameType` in MongoDB). */
  gameType: string;
  teamSize: number;
  players: QueuePlayer[];
  eloTier?: string | null;
  minElo: number;
  maxElo: number;
  status: "active" | "inactive";
  name?: string;
  /**
   * When true (e.g. queue setting), player ELO is hidden at every breakpoint.
   * TODO(queue-privacy): Persist on `Queues` in MongoDB; edit via Admin → Edit Queue Details
   * (`app/admin/queues/page.tsx`) and `PATCH /api/admin/queues/[queueId]/details`.
   */
  hidePlayerElo?: boolean;
  /** Discord role IDs allowed to join (whitelist). */
  requiredRoles?: string[];
  /** Display names parallel to `requiredRoles` (from GET /api/queues). */
  requiredRoleNames?: string[];
}

interface QueueCardProps {
  queue: Queue;
  activePlayers: QueuePlayer[];
  waitlistPlayers: QueuePlayer[];
  isPlayerInQueue: boolean;
  canLaunch: boolean;
  hasRequired: boolean;
  joiningQueue: string | null;
  leavingQueue: string | null;
  pendingOperations: Set<string>;
  formatJoinTime: (t: number | string | Date) => string;
  onJoin: () => void;
  onLeave: () => void;
  onLaunch: () => void;
  onFill: () => void;
  onClear: () => void;
  onCopyId: () => void;
  onRemovePlayer: (playerId: string, playerName: string) => void;
  onManageMaps: () => void;
  onDelete: () => void;
  showAdmin: boolean;
  showDeveloperAdmin: boolean;
  showManageMaps: boolean;
  /** Same access as admin queue bans API */
  showManageQueueBans: boolean;
  /** Opens queue bans dialog (e.g. on /matches/queues). */
  onManageQueueBans?: () => void;
  /**
   * When false, player ELO is hidden at all breakpoints (future: queue setting).
   * When true (default), ELO is hidden only below `sm` to give names more room on phones.
   */
  showPlayerElo?: boolean;
}

function QueueCardComponent({
  queue,
  activePlayers,
  waitlistPlayers,
  isPlayerInQueue,
  canLaunch,
  hasRequired,
  joiningQueue,
  leavingQueue,
  pendingOperations,
  formatJoinTime,
  onJoin,
  onLeave,
  onLaunch,
  onFill,
  onClear,
  onCopyId,
  onRemovePlayer,
  onManageMaps,
  onDelete,
  showAdmin,
  showDeveloperAdmin,
  showManageMaps,
  showManageQueueBans,
  onManageQueueBans,
  showPlayerElo = true,
}: QueueCardProps) {
  const [removePlayerDialogOpen, setRemovePlayerDialogOpen] = useState(false);
  const eloDisabled =
    !showPlayerElo || Boolean(queue.hidePlayerElo);
  const playerEloClass = eloDisabled
    ? "hidden"
    : "hidden sm:inline-flex items-center justify-center";
  const tierChip = getQueueTierChip(queue.eloTier);
  const rawQueueLabel = (queue.gameType ?? "").trim();
  const queueDisplayName =
    rawQueueLabel.toLowerCase() === "ranked"
      ? "Ranked"
      : rawQueueLabel;
  const totalSlots = queue.teamSize * 2;
  const isPending = pendingOperations.has(queue._id);
  const isJoining = joiningQueue === queue._id;
  const isLeaving = leavingQueue === queue._id;
  const isWorking = isJoining || isLeaving || isPending;

  const filledCount = Math.min(activePlayers.length, totalSlots);
  const emptyCount = totalSlots - filledCount;

  // 2-col layout for 4+ players per team to keep cards compact
  const useTwoColumns = queue.teamSize >= 4;

  const slots = [
    ...activePlayers.slice(0, totalSlots).map((p, i) => ({
      player: p as QueuePlayer | null,
      index: i,
    })),
    ...Array.from({ length: emptyCount }, (_, i) => ({
      player: null as QueuePlayer | null,
      index: filledCount + i,
    })),
  ];

  const requiredRoleIds = normalizeDiscordSnowflakeList(queue.requiredRoles);
  const roleWhitelistLabels =
    Array.isArray(queue.requiredRoleNames) &&
    queue.requiredRoleNames.length === requiredRoleIds.length
      ? queue.requiredRoleNames
      : requiredRoleIds;
  const roleGateSummary = roleWhitelistLabels.join(" · ");

  return (
    <div className="flex flex-col rounded-lg border border-border/50 bg-card overflow-hidden hover:border-border/80 transition-colors duration-150">
      {/* Context menu only on main card area — admin DropdownMenu must NOT sit inside ContextMenuTrigger (breaks Radix nested menus) */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex flex-col flex-1 min-h-0 cursor-context-menu outline-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 max-w-full items-baseline gap-2">
                {queueDisplayName ? (
                  <span className="truncate text-base font-semibold leading-tight text-foreground">
                    {queueDisplayName}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold tabular-nums tracking-tight text-muted-foreground",
                    !queueDisplayName && "text-base font-semibold text-foreground"
                  )}
                >
                  {queue.teamSize}v{queue.teamSize}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {tierChip ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                      tierChip.className
                    )}
                  >
                    {tierChip.label}
                  </span>
                ) : null}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {queue.minElo.toLocaleString()}–{queue.maxElo.toLocaleString()}
                </span>
                {requiredRoleIds.length > 0 ? (
                  <span
                    className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-border/50 bg-muted/25 px-2 py-0.5 text-[10px] font-medium text-foreground/90"
                    title={requiredRoleIds.join(", ")}
                    aria-label={`Role required: ${roleGateSummary}`}
                  >
                    <Lock
                      className="h-3 w-3 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">{roleGateSummary}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {isPlayerInQueue ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onLeave}
                disabled={isWorking}
                className="h-7 px-3 text-xs shrink-0"
              >
                {isLeaving || isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Leave"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onJoin}
                disabled={isWorking}
                className="h-7 px-3 text-xs shrink-0"
              >
                {isJoining || isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Join"
                )}
              </Button>
            )}
          </div>

          {/* Body */}
          <div className="p-4 flex-1">
            {/* Players label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                Players
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {filledCount}/{totalSlots}
              </span>
            </div>

            {/* Slot grid */}
            <div
              className={cn(useTwoColumns ? "grid grid-cols-2 gap-x-4" : "")}
            >
              {slots.map(({ player, index }) => (
                <div
                  key={player?.discordId ?? `empty-${index}`}
                  className="flex items-start justify-between gap-2 py-2 border-b border-border/20 last:border-0"
                >
                  {player ? (
                    <>
                      <div className="flex gap-1.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-muted-foreground/50 w-4 shrink-0 text-right tabular-nums pt-0.5">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium leading-tight truncate">
                            {player.discordNickname}
                          </p>
                          <p className="text-[10px] text-muted-foreground/90 mt-0.5 leading-snug">
                            {formatJoinTime(player.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-medium tabular-nums text-muted-foreground shrink-0 rounded-md bg-muted/40 border border-border/30 px-1.5 py-0.5 self-center",
                          playerEloClass,
                        )}
                      >
                        {player.elo.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 min-h-[2.25rem]">
                        <span className="text-[10px] font-mono text-muted-foreground/25 w-4 shrink-0 text-right tabular-nums">
                          {index + 1}
                        </span>
                        <div className="flex-1 border-b border-dashed border-border/20 mt-px" />
                      </div>
                      <span className="text-[11px] text-muted-foreground/25 shrink-0 self-center">
                        —
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Waitlist — always same vertical space (2 rows) to avoid layout shift */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Waitlist
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {waitlistPlayers.length}
                </span>
              </div>

              {/* Fixed height: exactly two player rows (matches active row rhythm) */}
              <div className="flex flex-col gap-1 rounded-md bg-muted/5 px-2 py-1.5">
                {[0, 1].map((slotIndex) => {
                  const player = waitlistPlayers[slotIndex];
                  const position = filledCount + slotIndex + 1;
                  return (
                    <div
                      key={player?.discordId ?? `waitlist-slot-${slotIndex}`}
                      className="flex items-center justify-between min-h-[2.25rem] py-0.5"
                    >
                      {player ? (
                        <>
                          <div className="flex gap-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-mono text-muted-foreground/40 w-4 shrink-0 text-right tabular-nums pt-0.5">
                              {position}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground leading-tight truncate">
                                {player.discordNickname}
                              </p>
                              <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">
                                {formatJoinTime(player.joinedAt)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-[11px] tabular-nums text-muted-foreground/70 shrink-0 rounded-md bg-muted/30 border border-border/25 px-1.5 py-0.5 self-center",
                              playerEloClass,
                            )}
                          >
                            {player.elo.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center min-w-0 w-full">
                          <span className="text-[10px] font-mono text-muted-foreground/25 w-4 shrink-0 text-right tabular-nums">
                            {position}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {waitlistPlayers.length > 2 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="mt-2 w-full text-left text-[11px] text-primary hover:underline"
                    >
                      View {waitlistPlayers.length - 2} more
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Waitlist</DialogTitle>
                      <DialogDescription>
                        {waitlistPlayers.length} player
                        {waitlistPlayers.length !== 1 ? "s" : ""} waiting
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto pr-1 -mr-1 max-h-[min(60vh,28rem)] space-y-0">
                      {waitlistPlayers.map((player, i) => (
                        <div
                          key={player.discordId}
                          className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono text-muted-foreground/50 w-6 shrink-0 tabular-nums text-right">
                              {filledCount + i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm truncate">
                                {player.discordNickname}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatJoinTime(player.joinedAt)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-sm tabular-nums text-muted-foreground ml-2 shrink-0",
                              playerEloClass,
                            )}
                          >
                            {player.elo.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          </div>
        </ContextMenuTrigger>

      {/* Right-click context menu */}
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={onCopyId}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Queue ID
        </ContextMenuItem>

        {showDeveloperAdmin && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={queue.players.length === 0}
              onSelect={() => setRemovePlayerDialogOpen(true)}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Remove player
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={onDelete}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Queue
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
      </ContextMenu>

      {/* Footer outside ContextMenuTrigger so admin DropdownMenu works */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border/40">
        <Button
          variant={hasRequired && canLaunch ? "outline" : "ghost"}
          size="sm"
          onClick={onLaunch}
          disabled={!canLaunch || isJoining}
          className={cn(
            "flex-1 h-8 text-xs",
            !hasRequired && "text-muted-foreground cursor-default"
          )}
        >
          {!hasRequired
            ? `Need ${totalSlots - filledCount} more player${totalSlots - filledCount !== 1 ? "s" : ""}`
            : "Launch Match"}
        </Button>

        {showAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Admin actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onFill}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Fill Queue
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onClear}
                disabled={queue.players.length === 0}
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Clear Queue
              </DropdownMenuItem>
              {showDeveloperAdmin && (
                <DropdownMenuItem
                  disabled={queue.players.length === 0}
                  onSelect={() => setRemovePlayerDialogOpen(true)}
                >
                  <UserMinus className="mr-2 h-3.5 w-3.5" />
                  Remove player
                </DropdownMenuItem>
              )}
              {showManageMaps && (
                <DropdownMenuItem onClick={onManageMaps}>
                  <MapPin className="mr-2 h-3.5 w-3.5" />
                  Manage Maps
                </DropdownMenuItem>
              )}
              {showManageQueueBans && (
                <DropdownMenuItem
                  onClick={onManageQueueBans}
                  disabled={!onManageQueueBans}
                >
                  <Ban className="mr-2 h-3.5 w-3.5" />
                  Queue bans
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCopyId}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Queue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {showDeveloperAdmin && (
          <Dialog
            open={removePlayerDialogOpen}
            onOpenChange={setRemovePlayerDialogOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Remove player</DialogTitle>
                <DialogDescription>
                  Choose a player to remove from this queue. You will be asked to
                  confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[min(50vh,20rem)] overflow-y-auto space-y-1 pr-1">
                {queue.players.length === 0 ? (
                  <p className="py-4 text-sm text-center text-muted-foreground">
                    No players in this queue.
                  </p>
                ) : (
                  queue.players.map((player, index) => (
                    <div
                      key={player.discordId}
                      className="flex items-center justify-between gap-2 sm:gap-3 rounded-md border border-border/50 px-2.5 py-2 sm:px-3"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="shrink-0 text-[10px] font-mono tabular-nums text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium">
                          {player.discordNickname}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 shrink-0 p-0 max-sm:[&_svg]:size-3 sm:h-9 sm:w-auto sm:px-3"
                        aria-label={`Remove ${player.discordNickname}`}
                        onClick={() => {
                          setRemovePlayerDialogOpen(false);
                          onRemovePlayer(
                            player.discordId,
                            player.discordNickname
                          );
                        }}
                      >
                        <Minus className="sm:hidden" aria-hidden />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRemovePlayerDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export const QueueCard = memo(QueueCardComponent);
