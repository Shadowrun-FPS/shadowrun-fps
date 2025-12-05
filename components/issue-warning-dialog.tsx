"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const rules = [
  { value: "harassment", label: "Harassment of other players" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spamming" },
  { value: "impersonation", label: "Impersonation" },
  { value: "violations", label: "Repeated violations of community guidelines" },
  { value: "custom", label: "Custom Reason" },
];

interface IssueWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
  onComplete?: () => void;
}

export function IssueWarningDialog({
  open,
  onOpenChange,
  playerId,
  playerName,
  onComplete,
}: IssueWarningDialogProps) {
  const [rule, setRule] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setRule("");
    setReason("");
    setError("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    // Validate reason is provided
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/moderation/warn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          playerName,
          rule,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to issue warning");
      }

      toast({
        title: "Warning Issued",
        description: `A warning has been issued to ${playerName}.`,
      });

      handleClose();
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error issuing warning:", error);
      setError("Failed to issue warning. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Issue Warning
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Issue a warning to this player for violating the rules.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="rule-select" className="text-sm font-medium">
              Rule Violated
            </Label>
            <Select value={rule} onValueChange={setRule}>
              <SelectTrigger id="rule-select">
                <SelectValue placeholder="Select a rule" />
              </SelectTrigger>
              <SelectContent>
                {rules.map((rule) => (
                  <SelectItem key={rule.value} value={rule.value}>
                    {rule.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason-textarea" className="text-sm font-medium">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is being taken..."
              className="h-24 resize-none"
              required
              aria-describedby={error ? "reason-error" : undefined}
              aria-invalid={!!error}
            />
            {error && (
              <p id="reason-error" className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Issue Warning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
