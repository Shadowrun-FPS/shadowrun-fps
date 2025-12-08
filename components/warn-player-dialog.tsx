"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define rules for warnings
const rules = [
  { value: "harassment", label: "Harassment of other players" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spamming" },
  { value: "impersonation", label: "Impersonation" },
  { value: "violations", label: "Repeated violations of community guidelines" },
  { value: "custom", label: "Custom Reason" },
];

// Define schema with required reason
const warningFormSchema = z.object({
  rule: z.string().optional(),
  reason: z
    .string({
      required_error: "Please provide a reason for this warning",
    })
    .min(1, "Reason is required"),
});

type WarningFormValues = z.infer<typeof warningFormSchema>;

interface WarnPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  playerId: string;
  onWarningComplete: () => void;
}

export function WarnPlayerDialog({
  open,
  onOpenChange,
  playerName,
  playerId,
  onWarningComplete,
}: WarnPlayerDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form with default values
  const form = useForm<WarningFormValues>({
    resolver: zodResolver(warningFormSchema),
    defaultValues: {
      rule: "",
      reason: "",
    },
  });

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  // Handle form submission
  const handleWarn = async () => {
    if (!form.getValues("reason")) {
      setError("Please provide a reason for the warning");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get the player's details first to ensure we have the correct name
      const playerResponse = await fetch(`/api/players/${playerId}`);
      if (!playerResponse.ok) {
        throw new Error("Failed to fetch player details");
      }
      const playerData = await playerResponse.json();

      // Now create the warning with correct player and moderator information
      const response = await fetch("/api/moderation/warn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          playerName: playerData.discordNickname || playerData.discordUsername, // Use player's name
          reason: form.getValues("reason"),
          ruleId: form.getValues("rule") || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to warn player");
      }

      toast({
        title: "Player warned",
        description: `Successfully warned ${
          playerData.discordNickname || playerData.discordUsername
        }`,
      });

      // Refresh the page to show updated data
      router.refresh();

      onWarningComplete();
      handleOpenChange(false);
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error warning player:", error);
      }
      setError(
        error instanceof Error ? error.message : "Failed to warn player"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Issue Warning
          </DialogTitle>
          <DialogDescription>
            Issue a warning to this player for violating the rules.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleWarn)} className="space-y-4">
            <FormField
              control={form.control}
              name="rule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Violated</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rule" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rules.map((rule) => (
                        <SelectItem key={rule.value} value={rule.value}>
                          {rule.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this action is being taken..."
                      className="h-24 resize-none"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Issue Warning"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
