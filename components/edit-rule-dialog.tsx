"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SimpleRichTextEditor as RichTextEditor } from "@/components/simple-rich-text-editor";
import { Rule } from "@/types/moderation";

interface EditRuleDialogProps {
  rule: Rule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRuleUpdated: () => void;
}

export function EditRuleDialog({
  rule,
  open,
  onOpenChange,
  onRuleUpdated,
}: EditRuleDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form with rule data
  useEffect(() => {
    if (rule) {
      setTitle(rule.title);
      setDescription(rule.description || "");
    }
  }, [rule]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Rule title is required.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/admin/rules/${rule._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update rule");
      }

      toast({
        title: "Success",
        description: "Rule updated successfully.",
      });

      onOpenChange(false);
      onRuleUpdated();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update rule. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Rule</DialogTitle>
          <DialogDescription>
            Update the community rule details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-rule-title" className="text-right">
              Rule Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-rule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-rule-description" className="text-right">
              Description (Optional)
            </Label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe the rule in detail..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
