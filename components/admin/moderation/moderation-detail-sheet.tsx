"use client";

import { useCallback } from "react";
import { Copy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatModerationLogDateParts } from "@/lib/moderation-log-date";
import type { AdminModerationLog } from "@/types/moderation-log";
import { cn } from "@/lib/utils";

function LogDateCell({ iso }: { iso: string }) {
  const parts = formatModerationLogDateParts(iso);
  return (
    <time dateTime={parts.dateTimeAttr} className="tabular-nums" title={parts.secondary || undefined}>
      {parts.primary}
    </time>
  );
}

/** Human-readable action label for sheet subtitle and similar UI */
function formatModerationActionLabel(action: string): string {
  switch (action) {
    case "warn":
      return "Warning";
    case "ban":
      return "Ban";
    case "unban":
      return "Unban";
    case "queue_remove_player":
      return "Queue Removal";
    default:
      return action
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
  }
}

/** Light touch-ups for reason text (e.g. MongoDB id → MongoDB ID) */
function formatReasonForDisplay(reason: string): string {
  return reason.replace(/\bMongoDB id\b/gi, "MongoDB ID");
}

interface ModerationDetailSheetProps {
  detailLog: AdminModerationLog | null;
  detailOpen: boolean;
  setDetailOpen: (open: boolean) => void;
  setDetailLog: (log: AdminModerationLog | null) => void;
}

export function ModerationDetailSheet({
  detailLog,
  detailOpen,
  setDetailOpen,
  setDetailLog,
}: ModerationDetailSheetProps) {
  const { toast } = useToast();

  const copyText = useCallback(
    async (text: string, description: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description });
      } catch {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Could not copy to clipboard.",
        });
      }
    },
    [toast],
  );

  return (
    <Sheet
      open={detailOpen}
      onOpenChange={(open) => {
        setDetailOpen(open);
        if (!open) setDetailLog(null);
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Moderation Entry</SheetTitle>
          <SheetDescription>
            {detailLog
              ? `${formatModerationActionLabel(detailLog.action)} · ${detailLog.playerName}`
              : "Details"}
          </SheetDescription>
        </SheetHeader>
        {detailLog ? (
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">When</p>
              <div className="mt-0.5">
                <LogDateCell iso={detailLog.timestamp} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatModerationLogDateParts(detailLog.timestamp).relative}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Player</p>
              <p>{detailLog.playerName}</p>
              {(() => {
                const pid = detailLog.playerId?.trim() ?? "";
                const did = detailLog.playerDiscordId?.trim() ?? "";
                const same = pid !== "" && did !== "" && pid === did;
                if (same) {
                  return (
                    <IdWithCopy
                      label="ID"
                      value={pid}
                      onCopy={() => void copyText(pid, "Player ID copied to clipboard")}
                    />
                  );
                }
                return (
                  <div className="space-y-1">
                    {pid ? (
                      <IdWithCopy
                        label="ID"
                        value={pid}
                        onCopy={() => void copyText(pid, "Player ID copied to clipboard")}
                      />
                    ) : null}
                    {did ? (
                      <IdWithCopy
                        label="Discord"
                        value={did}
                        onCopy={() => void copyText(did, "Discord ID copied to clipboard")}
                      />
                    ) : null}
                  </div>
                );
              })()}
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Moderator</p>
              <p>{detailLog.moderatorName}</p>
              {(() => {
                const modId = (detailLog.moderatorDiscordId ?? detailLog.moderatorId)?.trim() ?? "";
                if (!modId) return null;
                return (
                  <IdWithCopy
                    label="ID"
                    value={modId}
                    onCopy={() => void copyText(modId, "Moderator ID copied to clipboard")}
                  />
                );
              })()}
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Reason</p>
              <p className="whitespace-pre-wrap">{formatReasonForDisplay(detailLog.reason)}</p>
            </div>
            {(detailLog.duration || detailLog.expiry) && (
              <div>
                <p className="font-medium text-muted-foreground">Duration / expiry</p>
                <p>
                  {detailLog.duration ?? "—"}
                  {detailLog.expiry
                    ? ` · Expires ${formatModerationLogDateParts(detailLog.expiry).primary}`
                    : ""}
                </p>
              </div>
            )}
            {detailLog.action === "ban" && typeof detailLog.banIsActive === "boolean" && (
              <div>
                <p className="font-medium text-muted-foreground">Status</p>
                <p>
                  {detailLog.banIsActive
                    ? "Still active"
                    : "No longer active (unbanned or expired)"}
                </p>
              </div>
            )}
            <IdWithCopy
              label="Log ID"
              value={detailLog._id}
              onCopy={() => void copyText(detailLog._id, "Log ID copied to clipboard")}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function IdWithCopy({
  label,
  value,
  onCopy,
  className,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <p className="min-w-0 flex-1 break-all leading-snug pt-0.5">
        <span className="text-muted-foreground font-medium">{label}:</span>{" "}
        <span className="font-mono text-[13px] tabular-nums tracking-tight text-foreground">
          {value}
        </span>
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onCopy}
        title={`Copy ${label}`}
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden />
      </Button>
    </div>
  );
}
