"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Check, AlertTriangle, Ban } from "lucide-react";

interface Dispute {
  _id: string;
  moderationLogId: string;
  playerId: string;
  playerName: string;
  playerDiscordId: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  moderationAction: {
    _id: string;
    type: string;
    playerId: string;
    playerName: string;
    reason: string;
    duration: string;
    active: boolean;
    moderatorId: string;
    moderatorName: string;
    timestamp: string;
  };
}

interface DisputeReviewDialogProps {
  dispute: Dispute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisputeResolved: () => void;
}

export function DisputeReviewDialog({
  dispute,
  open,
  onOpenChange,
  onDisputeResolved,
}: DisputeReviewDialogProps) {
  const [decision, setDecision] = useState<"keep" | "modify" | "remove">(
    "keep"
  );
  const [modifiedBanDuration, setModifiedBanDuration] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!dispute) return null;

  const handleResolveDispute = async (approved: boolean) => {
    try {
      setIsSubmitting(true);

      // Call API to update the dispute
      const response = await fetch(`/api/moderation/disputes/${dispute._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: approved ? "approved" : "denied",
          decision: approved ? decision : "keep",
          modifiedBanDuration:
            approved && decision === "modify" ? modifiedBanDuration : undefined,
          responseMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update dispute");
      }

      toast({
        title: approved ? "Dispute Approved" : "Dispute Denied",
        description: `The dispute has been ${
          approved ? "approved" : "denied"
        } and the player has been notified.`,
        variant: approved ? "default" : "destructive",
      });

      onDisputeResolved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: "Failed to resolve the dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case "warning":
        return (
          <Badge className="text-white border-0 bg-amber-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      case "temp_ban":
        return (
          <Badge className="text-white bg-red-500 border-0">
            <Ban className="w-3 h-3 mr-1" />
            Temporary Ban
          </Badge>
        );
      case "perm_ban":
        return (
          <Badge className="text-white bg-red-800 border-0">
            <Ban className="w-3 h-3 mr-1" />
            Permanent Ban
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Dispute</DialogTitle>
          <DialogDescription>
            Review the player&apos;s dispute and decide whether to uphold,
            modify, or remove the moderation action.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Player Information */}
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold">Player Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Player Name
                </p>
                <p className="font-medium">{dispute.playerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Discord ID
                </p>
                <p className="font-mono">{dispute.playerDiscordId}</p>
              </div>
            </div>
          </div>

          {/* Original Moderation Action */}
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold">
              Original Moderation Action
            </h3>
            <div className="grid gap-4">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  {renderBadge(dispute.moderationAction.type)}
                  <span className="text-sm font-medium">
                    {dispute.moderationAction.duration &&
                    dispute.moderationAction.duration !== "N/A"
                      ? `(${dispute.moderationAction.duration})`
                      : ""}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(
                    new Date(dispute.moderationAction.timestamp),
                    "MMMM d, yyyy"
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reason
                </p>
                <p>{dispute.moderationAction.reason}</p>
              </div>
            </div>
          </div>

          {/* Dispute Information */}
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold">Dispute Reason</h3>
            <div className="p-3 rounded-md bg-muted">
              <p>{dispute.reason}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(dispute.createdAt), "MMMM d, yyyy")}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold">Resolution</h3>
            <div className="grid gap-4">
              <Select
                value={decision}
                onValueChange={(value) =>
                  setDecision(value as "keep" | "modify" | "remove")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">
                    Keep original moderation action
                  </SelectItem>
                  <SelectItem value="modify">
                    Modify moderation action
                  </SelectItem>
                  <SelectItem value="remove">
                    Remove moderation action
                  </SelectItem>
                </SelectContent>
              </Select>

              {decision === "modify" && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    New Ban Duration
                  </label>
                  <Select
                    value={modifiedBanDuration}
                    onValueChange={setModifiedBanDuration}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 day">1 day</SelectItem>
                      <SelectItem value="3 days">3 days</SelectItem>
                      <SelectItem value="7 days">7 days</SelectItem>
                      <SelectItem value="14 days">14 days</SelectItem>
                      <SelectItem value="30 days">30 days</SelectItem>
                      <SelectItem value="warning">
                        Convert to warning
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Response to Player
                </label>
                <Textarea
                  placeholder="Explain your decision to the player..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => handleResolveDispute(false)}
            disabled={isSubmitting || !responseMessage}
          >
            Deny Dispute
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleResolveDispute(true)}
              disabled={
                isSubmitting ||
                !responseMessage ||
                (decision === "modify" && !modifiedBanDuration)
              }
            >
              {decision === "keep"
                ? "Uphold Action"
                : decision === "modify"
                ? "Modify Action"
                : "Remove Action"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
