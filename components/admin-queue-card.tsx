"use client";

import { memo } from "react";
import {
  Ban,
  Copy,
  Hash,
  MapPin,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getQueueTierChip } from "@/lib/queue-tier-config";
import type { AdminQueueRecord } from "@/types/admin-queue";

export type AdminQueueCardQueue = AdminQueueRecord;

interface AdminQueueCardProps {
  queue: AdminQueueRecord;
  roles: { id: string; name: string }[];
  channels: { id: string; name: string; type: number }[];
  selectedMapCount: number;
  totalMapCount: number;
  hasCustomMapPool: boolean;
  onEditDetails: () => void;
  onManageMaps: () => void;
  onManageBannedPlayers: () => void;
  onCopyQueueId: () => void;
  onCopyChannelId: (channelId: string, label: string) => void;
}

function statusDotClass(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s === "active") {
    return "bg-emerald-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.45)]";
  }
  if (s === "open") {
    return "bg-sky-500";
  }
  return "bg-muted-foreground/50";
}

function AdminQueueCardComponent({
  queue,
  roles,
  channels,
  selectedMapCount,
  totalMapCount,
  hasCustomMapPool,
  onEditDetails,
  onManageMaps,
  onManageBannedPlayers,
  onCopyQueueId,
  onCopyChannelId,
}: AdminQueueCardProps) {
  const tierChip = getQueueTierChip(queue.eloTier);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[var(--admin-queue-card-min-height)] flex-col overflow-hidden rounded-lg border border-border/40 bg-card transition-[border-color,box-shadow] duration-200 hover:border-border/70",
        hasCustomMapPool && "border-l-2 border-l-primary pl-px"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="shrink-0 text-sm font-bold tabular-nums tracking-tight">
            {queue.teamSize}v{queue.teamSize}
          </span>
          {tierChip ? (
            <span
              className={cn(
                "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                tierChip.className
              )}
            >
              {tierChip.label}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDotClass(queue.status))}
              aria-hidden
            />
            {queue.status || "Unknown"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              aria-label="Queue actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onEditDetails}>
              <Settings className="mr-2 h-3.5 w-3.5" />
              Queue details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageMaps}>
              <MapPin className="mr-2 h-3.5 w-3.5" />
              Map pool
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageBannedPlayers}>
              <Ban className="mr-2 h-3.5 w-3.5" />
              Queue bans
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCopyQueueId}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Copy queue ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold leading-tight">
            {queue.gameType}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/90 tabular-nums">
            <span className="select-all">{queue.queueId}</span>
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="tabular-nums">
            <span className="text-foreground/80">{selectedMapCount}</span>
            <span className="text-muted-foreground"> / </span>
            {totalMapCount} maps
          </p>
          {queue.minElo !== undefined && queue.maxElo !== undefined ? (
            <p className="tabular-nums">
              ELO {queue.minElo.toLocaleString()}–{queue.maxElo.toLocaleString()}
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Roles
          </p>
          {queue.requiredRoles && queue.requiredRoles.length > 0 ? (
            <div className="flex min-h-[21px] flex-wrap items-center gap-1">
              {queue.requiredRoles.map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                return role ? (
                  <span
                    key={roleId}
                    className="rounded border border-border/50 bg-muted/20 px-1.5 py-0.5 text-[10px] font-medium leading-none text-foreground/90"
                  >
                    {role.name}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <p className="flex min-h-[21px] items-center text-[11px] leading-none text-muted-foreground/85">
              No role restrictions
            </p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Channels
          </p>
          <div className="flex flex-col gap-1.5">
            {queue.customQueueChannel ? (
              <div className="flex h-7 items-center gap-1.5 text-[11px] text-muted-foreground">
                <Hash className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  #
                  {channels.find((c) => c.id === queue.customQueueChannel)
                    ?.name || queue.customQueueChannel}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 shrink-0 p-0"
                  onClick={() =>
                    onCopyChannelId(
                      queue.customQueueChannel!,
                      "Queue channel ID"
                    )
                  }
                  aria-label="Copy queue channel ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex h-7 items-center gap-1.5 text-[11px] text-muted-foreground/85">
                <Hash
                  className="h-3.5 w-3.5 shrink-0 text-primary/80"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">
                  # Queue: default team-size channel
                </span>
                <span className="h-6 w-6 shrink-0" aria-hidden />
              </div>
            )}
            {queue.customMatchChannel ? (
              <div className="flex h-7 items-center gap-1.5 text-[11px] text-muted-foreground">
                <Hash className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  #
                  {channels.find((c) => c.id === queue.customMatchChannel)
                    ?.name || queue.customMatchChannel}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 shrink-0 p-0"
                  onClick={() =>
                    onCopyChannelId(
                      queue.customMatchChannel!,
                      "Match channel ID"
                    )
                  }
                  aria-label="Copy match channel ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex h-7 items-center gap-1.5 text-[11px] text-muted-foreground/85">
                <Hash
                  className="h-3.5 w-3.5 shrink-0 text-primary/80"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">
                  # Match: default #matches channel
                </span>
                <span className="h-6 w-6 shrink-0" aria-hidden />
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />
      </div>
    </div>
  );
}

export const AdminQueueCard = memo(AdminQueueCardComponent);
