"use client";

import { useState, ChangeEvent, FormEvent } from "react";
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
import { UserPlus } from "lucide-react";
import { z } from "zod";
import { useToast } from "./ui/use-toast";

// Form validation schema
const playerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters"),
  displayName: z.string().optional(),
  discordId: z.string().optional(),
});

// Add interfaces for your form data and errors
interface PlayerFormData {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  notes?: string;
  [key: string]: string | undefined; // Index signature to allow string indexing
}

interface FormErrors {
  discordId?: string;
  discordUsername?: string;
  discordNickname?: string;
  notes?: string;
  [key: string]: string | undefined; // Index signature to allow string indexing
}

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function AddPlayerDialog({
  open,
  onOpenChange,
  onComplete,
}: AddPlayerDialogProps) {
  const { toast } = useToast();

  // Update state types
  const [formData, setFormData] = useState<PlayerFormData>({
    discordId: "",
    discordUsername: "",
    discordNickname: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const parsedData = playerSchema.parse(formData);

      // Here you would implement the actual player creation logic
      console.log("Creating player:", parsedData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form and close dialog
      setFormData({
        discordId: "",
        discordUsername: "",
        discordNickname: "",
        notes: "",
      });
      setErrors({});
      onOpenChange(false);

      // You would typically refresh the player list here

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Create a properly typed error object
        const formattedErrors: FormErrors = {};

        error.errors.forEach((err) => {
          // Handle the case where the path might be a string or number
          const field = err.path[0];
          if (typeof field === "string") {
            formattedErrors[field] = err.message;
          }
        });

        setErrors(formattedErrors);
      } else {
        // Handle other errors
        console.error("Error creating player:", error);
        setErrors({ form: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Player
          </DialogTitle>
          <DialogDescription>
            Create a new player account. They will receive an email with login
            instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="player123"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "border-destructive" : ""}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display Name{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Pro Gamer"
                value={formData.displayName}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordId" className="text-sm font-medium">
                Discord ID{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                id="discordId"
                name="discordId"
                placeholder="username#1234"
                value={formData.discordId}
                onChange={handleChange}
              />
            </div>
          </div>

          {errors.form && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
              {errors.form}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Player"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
