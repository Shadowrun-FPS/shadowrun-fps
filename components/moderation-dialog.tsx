"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Player, ModerationActionType, Rule } from "@/types/moderation";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Ban, Clock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ModerationDialogProps {
  player: Player;
  action: ModerationActionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModerationDialog({
  player,
  action,
  open,
  onOpenChange,
}: ModerationDialogProps) {
  const [reason, setReason] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [useRule, setUseRule] = useState(false);
  const [duration, setDuration] = useState("24h");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isAlreadyBanned = player.isBanned;

  useEffect(() => {
    const fetchRules = async () => {
      setIsLoadingRules(true);
      try {
        const response = await fetch("/api/admin/rules");
        if (!response.ok) {
          throw new Error("Failed to fetch rules");
        }
        const data = await response.json();
        setRules(data);
      } catch (error) {
        console.error("Error fetching rules:", error);
      } finally {
        setIsLoadingRules(false);
      }
    };

    if (open) {
      fetchRules();
    }
  }, [open]);

  const handleSubmit = () => {
    if (action === "unban") {
      executeModeration();
    } else {
      // Show confirmation dialog for warnings and bans
      setShowConfirmation(true);
    }
  };

  const executeModeration = async () => {
    setIsSubmitting(true);
    try {
      const endpoint =
        action === "warn"
          ? `/api/admin/players/${player._id}/warn`
          : action === "ban"
          ? `/api/admin/players/${player._id}/ban`
          : `/api/admin/players/${player._id}/unban`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason || null,
          ruleId: useRule ? ruleId : null,
          duration: action === "ban" ? duration : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Unban error details:", errorData);
        throw new Error(
          `Failed to ${
            action === "warn" ? "warn" : action === "ban" ? "ban" : "unban"
          } player: ${errorData?.details || response.statusText}`
        );
      }

      toast({
        title:
          action === "warn"
            ? "Warning Issued"
            : action === "ban"
            ? "Player Banned"
            : "Ban Removed",
        description:
          action === "unban"
            ? `${
                player.discordNickname || player.discordUsername
              }'s ban has been removed.`
            : `${player.discordNickname || player.discordUsername} has been ${
                action === "warn" ? "warned" : "banned"
              }.`,
        variant: "default",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error(`Error ${action}ing player:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${
          action === "warn" ? "warn" : action === "ban" ? "ban" : "unban"
        } player. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleRuleChange = (value: string) => {
    setRuleId(value);

    if (value === "custom") {
      setTimeout(() => {
        const reasonTextarea = document.getElementById("reason");
        if (reasonTextarea) {
          (reasonTextarea as HTMLTextAreaElement).focus();
        }
      }, 0);
    }
  };

  return (
    <>
      <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {action === "warn" ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Issue Warning
                  </>
                ) : action === "ban" ? (
                  <>
                    <Ban className="w-5 h-5 text-destructive" />
                    {isAlreadyBanned ? "Update Ban" : "Ban"}{" "}
                    {player.discordNickname || player.discordUsername}
                  </>
                ) : (
                  <>
                    <Ban className="w-5 h-5 text-destructive" />
                    Unban Player
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {action === "warn"
                  ? "Issue a warning to this player for violating the rules."
                  : action === "ban"
                  ? "Ban this player from the game. They will not be able to join matches until the ban expires."
                  : "Remove the ban from this player, allowing them to join matches again."}
              </DialogDescription>
            </DialogHeader>

            {/* Custom form based on action type */}
            {action === "unban" ? (
              <>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="font-medium">
                      Reason{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Explain why this action is being taken..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-24"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Unbanning...
                      </>
                    ) : (
                      "Unban Player"
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                {/* Existing warning and ban form content */}
                {action === "ban" && (
                  <div className="mb-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label className="font-medium">Ban Duration</Label>
                      </div>

                      <RadioGroup
                        value={duration}
                        onValueChange={setDuration}
                        className="grid grid-cols-2 gap-2 mb-2"
                      >
                        <div
                          className={`p-2 rounded-md border ${
                            duration === "24h"
                              ? "bg-muted border-primary"
                              : "border-border"
                          }`}
                        >
                          <RadioGroupItem
                            value="24h"
                            id="24h"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="24h"
                            className={`w-full h-full flex items-center justify-center cursor-pointer ${
                              duration === "24h" ? "font-medium" : ""
                            }`}
                          >
                            24 Hours
                          </Label>
                        </div>
                        <div
                          className={`p-2 rounded-md border ${
                            duration === "3d"
                              ? "bg-muted border-primary"
                              : "border-border"
                          }`}
                        >
                          <RadioGroupItem
                            value="3d"
                            id="3d"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="3d"
                            className={`w-full h-full flex items-center justify-center cursor-pointer ${
                              duration === "3d" ? "font-medium" : ""
                            }`}
                          >
                            3 Days
                          </Label>
                        </div>
                        <div
                          className={`p-2 rounded-md border ${
                            duration === "7d"
                              ? "bg-muted border-primary"
                              : "border-border"
                          }`}
                        >
                          <RadioGroupItem
                            value="7d"
                            id="7d"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="7d"
                            className={`w-full h-full flex items-center justify-center cursor-pointer ${
                              duration === "7d" ? "font-medium" : ""
                            }`}
                          >
                            7 Days
                          </Label>
                        </div>
                        <div
                          className={`p-2 rounded-md border ${
                            duration === "30d"
                              ? "bg-muted border-primary"
                              : "border-border"
                          }`}
                        >
                          <RadioGroupItem
                            value="30d"
                            id="30d"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="30d"
                            className={`w-full h-full flex items-center justify-center cursor-pointer ${
                              duration === "30d" ? "font-medium" : ""
                            }`}
                          >
                            30 Days
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Permanent Ban as a button */}
                      <Button
                        type="button"
                        variant={
                          duration === "permanent" ? "default" : "outline"
                        }
                        className={`w-full ${
                          duration === "permanent"
                            ? "bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                            : ""
                        }`}
                        onClick={() => setDuration("permanent")}
                      >
                        Permanent Ban
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleId" className="flex items-center gap-1">
                      Rule Violated{" "}
                      <span className="text-xs text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Select
                      value={ruleId || "custom"}
                      onValueChange={handleRuleChange}
                    >
                      <SelectTrigger id="ruleId">
                        <SelectValue placeholder="Select a rule..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Reason</SelectItem>
                        {rules.map((rule) => (
                          <SelectItem key={rule._id} value={rule._id}>
                            {rule.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="flex items-center gap-1">
                      Reason{" "}
                      <span className="text-xs text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why this action is being taken..."
                      className="min-h-[80px] bg-background"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant={action === "ban" ? "destructive" : "default"}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {action === "warn"
                          ? "Warning"
                          : action === "ban"
                          ? "Banning"
                          : "Unbanning"}
                        ...
                      </>
                    ) : action === "warn" ? (
                      "Issue Warning"
                    ) : action === "ban" ? (
                      `Apply ${
                        duration === "permanent"
                          ? "Permanent Ban"
                          : duration === "24h"
                          ? "24 Hours"
                          : duration === "3d"
                          ? "3 Days"
                          : duration === "7d"
                          ? "7 Days"
                          : "30 Days"
                      }`
                    ) : (
                      "Unban Player"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm{" "}
              {action === "warn"
                ? "Warning"
                : action === "ban"
                ? "Ban"
                : "Unban"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {action === "warn" ? "warn" : action === "ban" ? "ban" : "unban"}{" "}
              {player.discordNickname || player.discordUsername}?
              {action === "ban" && duration !== "permanent" && (
                <>
                  {" "}
                  This ban will last for{" "}
                  {duration === "24h"
                    ? "24 hours"
                    : duration === "3d"
                    ? "3 days"
                    : duration === "7d"
                    ? "7 days"
                    : "30 days"}
                  .
                </>
              )}
              {action === "ban" && duration === "permanent" && (
                <> This is a permanent ban.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} onClick={handleCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeModeration}
              disabled={isSubmitting}
              className={
                action === "ban"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
