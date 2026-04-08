"use client";

import { cn } from "@/lib/utils";
import { getQueueTierChip } from "@/lib/queue-tier-config";
import type { AdminQueueRecord } from "@/types/admin-queue";

export function AdminQueueDialogContextHeader({
  queue,
}: {
  queue: AdminQueueRecord;
}) {
  const tierChip = getQueueTierChip(queue.eloTier);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold tabular-nums tracking-tight">
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
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {queue.gameType}
        </span>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground/90 tabular-nums">
        <span className="select-all">{queue.queueId}</span>
      </p>
    </>
  );
}
