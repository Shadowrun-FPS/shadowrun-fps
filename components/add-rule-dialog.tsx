"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SimpleRichTextEditor as RichTextEditor } from "@/components/simple-rich-text-editor";

export function AddRuleDialog({ onRuleAdded }: { onRuleAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      const response = await fetch("/api/admin/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create rule");
      }

      toast({
        title: "Success",
        description: "Rule created successfully.",
      });

      setTitle("");
      setDescription("");
      setOpen(false);
      onRuleAdded();
    } catch (error) {
      console.error("Error creating rule:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create rule. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Rule</DialogTitle>
          <DialogDescription>
            Create a new community rule that players must follow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rule-title" className="text-right">
              Rule Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., No harassment or bullying"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-description" className="text-right">
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
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
