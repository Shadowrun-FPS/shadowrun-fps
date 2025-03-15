"use client";

import { useState } from "react";
import { Ban, X } from "lucide-react";
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

const durations = [
  { value: "24h", label: "24 Hours" },
  { value: "3d", label: "3 Days" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "permanent", label: "Permanent Ban" },
];

// Rules that can be violated
const rules = [
  { value: "harassment", label: "Harassment of other players" },
  { value: "cheating", label: "Cheating or exploiting" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spamming" },
  { value: "impersonation", label: "Impersonation" },
  { value: "custom", label: "Custom Reason" },
];

// Define the form schema with validation
const banFormSchema = z.object({
  duration: z.string({
    required_error: "Please select a ban duration",
  }),
  rule: z.string().optional(),
  reason: z
    .string({
      required_error: "Please provide a reason for this action",
    })
    .min(1, "Reason is required"),
});

type BanFormValues = z.infer<typeof banFormSchema>;

interface BanPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  playerId: string;
  onBanComplete: () => void;
}

export function BanPlayerDialog({
  open,
  onOpenChange,
  playerName,
  playerId,
  onBanComplete,
}: BanPlayerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with default values
  const form = useForm<BanFormValues>({
    resolver: zodResolver(banFormSchema),
    defaultValues: {
      duration: "24h",
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
  const onSubmit = async (values: BanFormValues) => {
    if (!values.reason.trim()) {
      form.setError("reason", {
        type: "manual",
        message: "Reason cannot be empty",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/moderation/ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          duration: values.duration,
          reason: values.reason,
          rule: values.rule,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to ban player");
      }

      toast({
        title: "Player banned",
        description: `${playerName} has been banned for ${
          values.duration === "permanent" ? "permanently" : values.duration
        }.`,
      });

      onBanComplete();
      handleOpenChange(false);
    } catch (error) {
      console.error("Error banning player:", error);
      toast({
        title: "Error",
        description: "Failed to ban player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Ban className="w-5 h-5 mr-2 text-red-500" />
            Ban {playerName}
          </DialogTitle>
          <DialogDescription>
            Ban this player from the game. They will not be able to join matches
            until the ban expires.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Ban Duration</h4>
              <div className="grid grid-cols-2 gap-2">
                {durations.slice(0, 4).map((duration) => (
                  <Button
                    key={duration.value}
                    type="button"
                    variant={
                      form.watch("duration") === duration.value
                        ? "default"
                        : "outline"
                    }
                    onClick={() => form.setValue("duration", duration.value)}
                    className="w-full"
                  >
                    {duration.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant={
                  form.watch("duration") === "permanent" ? "default" : "outline"
                }
                onClick={() => form.setValue("duration", "permanent")}
                className="w-full mt-2"
              >
                Permanent Ban
              </Button>
            </div>

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
                {isSubmitting
                  ? "Banning..."
                  : `Apply ${
                      form.watch("duration") === "permanent"
                        ? "Permanent Ban"
                        : form.watch("duration")
                    }`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
