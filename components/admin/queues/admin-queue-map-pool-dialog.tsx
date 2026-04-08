"use client";

import { Check, Loader2, Save, Search } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import type { AdminQueueMapVariant, AdminQueueRecord } from "@/types/admin-queue";
import { AdminQueueDialogContextHeader } from "./admin-queue-dialog-context-header";

export interface AdminQueueMapPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: AdminQueueRecord | null;
  filteredMaps: AdminQueueMapVariant[];
  mapPoolSearch: string;
  setMapPoolSearch: (v: string) => void;
  selectedMapIds: string[];
  totalMapCount: number;
  onToggleMap: (mapId: string) => void;
  onSelectAllMaps: () => void;
  onDeselectAllMaps: () => void;
  saving: boolean;
  onSave: () => Promise<void>;
}

export function AdminQueueMapPoolDialog({
  open,
  onOpenChange,
  queue,
  filteredMaps,
  mapPoolSearch,
  setMapPoolSearch,
  selectedMapIds,
  totalMapCount,
  onToggleMap,
  onSelectAllMaps,
  onDeselectAllMaps,
  saving,
  onSave,
}: AdminQueueMapPoolDialogProps) {
  const selectedCount = selectedMapIds.length;
  const progressPct = totalMapCount
    ? (selectedCount / totalMapCount) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(ADMIN_QUEUE_DIALOG_SHELL, "sm:max-w-2xl")}
      >
        <DialogHeader className={ADMIN_QUEUE_DIALOG_HEADER}>
          <DialogTitle className={ADMIN_QUEUE_DIALOG_TITLE}>
            Map pool
          </DialogTitle>
          <DialogDescription className={ADMIN_QUEUE_DIALOG_DESC}>
            Toggle maps players can roll in this queue. Changes apply after you
            save.
          </DialogDescription>
          {queue ? <AdminQueueDialogContextHeader queue={queue} /> : null}
        </DialogHeader>
        <div
          className={cn(
            ADMIN_QUEUE_DIALOG_BODY,
            "flex min-h-[220px] flex-col gap-4"
          )}
        >
          {queue ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    ADMIN_QUEUE_FIELD_LABEL,
                    "text-foreground/80"
                  )}
                >
                  In pool
                </span>
                <span className="font-mono tabular-nums">
                  {selectedCount} / {totalMapCount}
                </span>
              </div>
              <Progress
                className="h-1.5 bg-muted"
                value={progressPct}
              />
            </div>
          ) : null}

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Search maps by name or mode…"
              value={mapPoolSearch}
              onChange={(e) => setMapPoolSearch(e.target.value)}
              className="pl-9"
              aria-label="Filter maps"
            />
          </div>

          <div className="flex gap-2 border-b border-border/40 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 flex-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              onClick={onSelectAllMaps}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 flex-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              onClick={onDeselectAllMaps}
            >
              Deselect all
            </Button>
          </div>

          <div className="min-h-[200px] flex-1 overflow-y-auto pr-1">
            {queue ? (
              filteredMaps.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No maps match &quot;{mapPoolSearch.trim()}&quot;
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {filteredMaps.map((map) => {
                    const isSelected = selectedMapIds.includes(map._id);
                    return (
                      <button
                        key={map._id}
                        type="button"
                        onClick={() => onToggleMap(map._id)}
                        className={cn(
                          "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-[border-color,background-color] duration-150",
                          isSelected
                            ? "border-primary/55 bg-primary/10 ring-1 ring-primary/25"
                            : "border-border/40 bg-muted/15 hover:border-border/70 hover:bg-muted/25"
                        )}
                      >
                        <div className="relative aspect-video w-full bg-muted/40">
                          <Image
                            src={map.src}
                            alt={map.name}
                            fill
                            className="object-cover"
                            loading="lazy"
                            unoptimized
                          />
                          {isSelected ? (
                            <div
                              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm"
                              aria-hidden
                            >
                              <Check
                                className="h-3.5 w-3.5"
                                strokeWidth={3}
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-0.5 p-2">
                          <p className="line-clamp-2 text-xs font-medium leading-snug">
                            {map.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {map.gameMode}
                            </span>
                            {map.rankedMap ? (
                              <Badge
                                variant="outline"
                                className="px-1 py-0 text-[9px] font-semibold uppercase tracking-wide"
                              >
                                Ranked
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : null}
          </div>
        </div>
        <DialogFooter className={cn(ADMIN_QUEUE_DIALOG_FOOTER, "gap-2")}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save map pool
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
