"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2, Save, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { AdminQueueRecord } from "@/types/admin-queue";
import { AdminQueueDialogContextHeader } from "./admin-queue-dialog-context-header";

export interface AdminQueueDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: AdminQueueRecord | null;
  queueName: string;
  setQueueName: (v: string) => void;
  teamSize: string;
  setTeamSize: (v: string) => void;
  queueTier: string;
  setQueueTier: (v: string) => void;
  minElo: string;
  setMinElo: (v: string) => void;
  maxElo: string;
  setMaxElo: (v: string) => void;
  requiredRoles: string[];
  setRequiredRoles: Dispatch<SetStateAction<string[]>>;
  customQueueChannel: string;
  setCustomQueueChannel: (v: string) => void;
  customMatchChannel: string;
  setCustomMatchChannel: (v: string) => void;
  roles: { id: string; name: string }[];
  channels: { id: string; name: string; type: number }[];
  roleSearch: string;
  setRoleSearch: (v: string) => void;
  savingDetails: boolean;
  onSave: () => Promise<void>;
}

/**
 * Edit queue details — ELO, channels, role gate.
 * TODO(queue-privacy): Add "Hide player ELO on cards" toggle; PATCH /api/admin/queues/[queueId]/details
 */
export function AdminQueueDetailsDialog({
  open,
  onOpenChange,
  queue,
  queueName,
  setQueueName,
  teamSize,
  setTeamSize,
  queueTier,
  setQueueTier,
  minElo,
  setMinElo,
  maxElo,
  setMaxElo,
  requiredRoles,
  setRequiredRoles,
  customQueueChannel,
  setCustomQueueChannel,
  customMatchChannel,
  setCustomMatchChannel,
  roles,
  channels,
  roleSearch,
  setRoleSearch,
  savingDetails,
  onSave,
}: AdminQueueDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(ADMIN_QUEUE_DIALOG_SHELL, "sm:max-w-[500px]")}
      >
        <DialogHeader className={ADMIN_QUEUE_DIALOG_HEADER}>
          <DialogTitle className={ADMIN_QUEUE_DIALOG_TITLE}>
            Queue details
          </DialogTitle>
          <DialogDescription className={ADMIN_QUEUE_DIALOG_DESC}>
            ELO range, Discord channels, and role gate for this queue.
          </DialogDescription>
          {queue ? <AdminQueueDialogContextHeader queue={queue} /> : null}
        </DialogHeader>
        <div
          className={cn(ADMIN_QUEUE_DIALOG_BODY, "max-h-[min(55vh,24rem)]")}
        >
          <div className="space-y-2">
            <Label htmlFor="gameType" className={ADMIN_QUEUE_FIELD_LABEL}>
              Queue Name<span className="text-destructive">*</span>
            </Label>
            <Input
              id="gameType"
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              placeholder="e.g., Ranked"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSize" className={ADMIN_QUEUE_FIELD_LABEL}>
              Team size<span className="text-destructive">*</span>
            </Label>
            <Input
              id="teamSize"
              type="number"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="1"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Supported sizes: 1v1, 2v2, 3v3, 4v4, 5v5, 8v8
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="eloTier" className={ADMIN_QUEUE_FIELD_LABEL}>
              Tier tag (optional)
            </Label>
            <Input
              id="eloTier"
              value={queueTier}
              onChange={(e) => setQueueTier(e.target.value)}
              placeholder="e.g. low, mid, high — or leave blank"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minElo" className={ADMIN_QUEUE_FIELD_LABEL}>
                Min ELO
              </Label>
              <Input
                id="minElo"
                type="number"
                value={minElo}
                onChange={(e) => setMinElo(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxElo" className={ADMIN_QUEUE_FIELD_LABEL}>
                Max ELO
              </Label>
              <Input
                id="maxElo"
                type="number"
                value={maxElo}
                onChange={(e) => setMaxElo(e.target.value)}
                placeholder="3000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className={ADMIN_QUEUE_FIELD_LABEL}>Roles whitelist</Label>
            <p className="text-[11px] text-muted-foreground">
              Only players with at least one of these roles can join this
              queue.
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {requiredRoles.map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                return (
                  <span
                    key={roleId}
                    className="inline-flex items-center gap-1 rounded border border-border/50 bg-muted/20 px-1.5 py-0.5 text-[10px] font-medium text-foreground/90"
                  >
                    {role?.name || roleId}
                    <button
                      type="button"
                      onClick={() =>
                        setRequiredRoles(
                          requiredRoles.filter((id) => id !== roleId)
                        )
                      }
                      className="rounded p-0.5 hover:text-destructive"
                      aria-label={`Remove ${role?.name || roleId}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !requiredRoles.includes(value)) {
                  setRequiredRoles([...requiredRoles, value]);
                  setRoleSearch("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search roles..." />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-10 border-b bg-background p-2">
                  <Input
                    placeholder="Search roles..."
                    value={roleSearch}
                    onChange={(e) => {
                      e.stopPropagation();
                      setRoleSearch(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {roles
                    .filter(
                      (role) =>
                        !requiredRoles.includes(role.id) &&
                        role.name
                          .toLowerCase()
                          .includes(roleSearch.toLowerCase())
                    )
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  {roles.filter(
                    (role) =>
                      !requiredRoles.includes(role.id) &&
                      role.name
                        .toLowerCase()
                        .includes(roleSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No roles found
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customQueueChannel"
              className={ADMIN_QUEUE_FIELD_LABEL}
            >
              Queue channel (optional)
            </Label>
            <Select
              value={customQueueChannel || "none"}
              onValueChange={(value) =>
                setCustomQueueChannel(value === "none" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                {channels
                  .filter((channel) => channel.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Override default team-size channel. Use Default for standard
              routing.
            </p>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customMatchChannel"
              className={ADMIN_QUEUE_FIELD_LABEL}
            >
              Match channel (optional)
            </Label>
            <Select
              value={customMatchChannel || "none"}
              onValueChange={(value) =>
                setCustomMatchChannel(value === "none" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                {channels
                  .filter((channel) => channel.type === 0)
                  .map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Match embeds post here instead of the default #matches channel.
            </p>
          </div>
        </div>
        <DialogFooter className={ADMIN_QUEUE_DIALOG_FOOTER}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void onSave()} disabled={savingDetails}>
            {savingDetails ? (
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
