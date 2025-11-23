"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { Plus, Shield, Users, Trophy, Loader2, X } from "lucide-react";
import { containsProfanity } from "@/lib/profanity-filter";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTeamFormProps {
  onSuccess?: () => void;
  isSheet?: boolean;
  onClose?: () => void;
}

export function CreateTeamForm({ onSuccess, isSheet = false, onClose }: CreateTeamFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tag: "",
    teamSize: 4,
  });
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    tag: false,
    description: false,
  });

  // If used in Sheet, start with form open
  useEffect(() => {
    if (isSheet) {
      setIsOpen(true);
    }
  }, [isSheet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a team",
        variant: "destructive",
      });
      return;
    }

    // Client-side profanity check
    if (containsProfanity(formData.name)) {
      toast({
        title: "Invalid Team Name",
        description: "Team name contains inappropriate language. Please choose a different name.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (containsProfanity(formData.tag)) {
      toast({
        title: "Invalid Team Tag",
        description: "Team tag contains inappropriate language. Please choose a different tag.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (containsProfanity(formData.description)) {
      toast({
        title: "Invalid Description",
        description: "Team description contains inappropriate language. Please revise your description.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          tag: formData.tag,
          teamSize: formData.teamSize,
          captain: session.user.id,
          captainProfilePicture: session.user.image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team");
      }

      toast({
        title: "Team Created",
        description: "Your team has been created successfully",
        duration: 2000,
      });
      setIsOpen(false);
      setFormData({ name: "", description: "", tag: "", teamSize: 4 });
      setValidationErrors({ name: false, tag: false, description: false });

      // Call onClose if provided (for Sheet context)
      if (onClose) {
        onClose();
      }

      // Optionally refresh the teams list
      window.location.reload();

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <>
      {isSheet ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
                <Shield className="relative w-5 h-5 text-primary drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                  Create New Team
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Start your competitive journey by creating a new team
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Team Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({ ...formData, name: newName });
                  setValidationErrors({
                    ...validationErrors,
                    name: containsProfanity(newName),
                  });
                }}
                placeholder="Enter team name"
                required
                className={cn(
                  "h-11 border-2 focus:border-primary/50 transition-colors",
                  validationErrors.name && "border-red-500 focus:border-red-500"
                )}
                maxLength={50}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/50 characters
                </p>
                {validationErrors.name && (
                  <p className="text-xs text-red-500 font-medium">
                    Inappropriate language detected
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize" className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Team Size
              </Label>
              <Select
                value={formData.teamSize.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, teamSize: parseInt(value) })
                }
              >
                <SelectTrigger className="h-11 border-2 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Duos (2 players)</SelectItem>
                  <SelectItem value="3">Trios (3 players)</SelectItem>
                  <SelectItem value="4">Squads (4 players)</SelectItem>
                  <SelectItem value="5">Full Team (5 players)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can only have one team per team size
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag" className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Team Tag
              </Label>
              <Input
                id="tag"
                value={formData.tag}
                onChange={(e) => {
                  const newTag = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setFormData({ ...formData, tag: newTag });
                  setValidationErrors({
                    ...validationErrors,
                    tag: containsProfanity(newTag),
                  });
                }}
                placeholder="Enter team tag (e.g., TSM)"
                maxLength={4}
                required
                className={cn(
                  "h-11 border-2 font-mono text-lg focus:border-primary/50 transition-colors",
                  validationErrors.tag && "border-red-500 focus:border-red-500"
                )}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Up to 4 uppercase letters or numbers
                </p>
                {validationErrors.tag && (
                  <p className="text-xs text-red-500 font-medium">
                    Inappropriate language detected
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const newDescription = e.target.value;
                  setFormData({ ...formData, description: newDescription });
                  setValidationErrors({
                    ...validationErrors,
                    description: containsProfanity(newDescription),
                  });
                }}
                placeholder="Enter team description"
                required
                className={cn(
                  "min-h-[100px] border-2 resize-none focus:border-primary/50 transition-colors",
                  validationErrors.description && "border-red-500 focus:border-red-500"
                )}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
                {validationErrors.description && (
                  <p className="text-xs text-red-500 font-medium">
                    Inappropriate language detected
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto h-11"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:flex-1 h-11" 
                disabled={
                  isLoading || 
                  validationErrors.name || 
                  validationErrors.tag || 
                  validationErrors.description
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 w-4 h-4" />
                    Create Team
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
                <Shield className="relative w-5 h-5 text-primary drop-shadow-sm" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                  Create New Team
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Start your competitive journey by creating a new team
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 pt-4 sm:pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Team Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({ ...formData, name: newName });
                  setValidationErrors({
                    ...validationErrors,
                    name: containsProfanity(newName),
                  });
                }}
                placeholder="Enter team name"
                required
                className={cn(
                  "h-11 border-2 focus:border-primary/50 transition-colors",
                  validationErrors.name && "border-red-500 focus:border-red-500"
                )}
                maxLength={50}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/50 characters
                </p>
                {validationErrors.name && (
                  <p className="text-xs text-red-500 font-medium">
                    Inappropriate language detected
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize" className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Team Size
              </Label>
              <Select
                value={formData.teamSize.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, teamSize: parseInt(value) })
                }
              >
                <SelectTrigger className="h-11 border-2 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Duos (2 players)</SelectItem>
                  <SelectItem value="3">Trios (3 players)</SelectItem>
                  <SelectItem value="4">Squads (4 players)</SelectItem>
                  <SelectItem value="5">Full Team (5 players)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can only have one team per team size
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag" className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Team Tag
              </Label>
              <Input
                id="tag"
                value={formData.tag}
                onChange={(e) => {
                  const newTag = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setFormData({ ...formData, tag: newTag });
                  setValidationErrors({
                    ...validationErrors,
                    tag: containsProfanity(newTag),
                  });
                }}
                placeholder="Enter team tag (e.g., TSM)"
                maxLength={4}
                required
                className={cn(
                  "h-11 border-2 font-mono text-lg focus:border-primary/50 transition-colors",
                  validationErrors.tag && "border-red-500 focus:border-red-500"
                )}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Up to 4 uppercase letters or numbers
                </p>
                {validationErrors.tag && (
                  <p className="text-xs text-red-500 font-medium">
                    Inappropriate language detected
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const newDescription = e.target.value;
                  setFormData({ ...formData, description: newDescription });
                  setValidationErrors({
                    ...validationErrors,
                    description: containsProfanity(newDescription),
                  });
                }}
                placeholder="Enter team description"
                required
                className={cn(
                  "min-h-[100px] border-2 resize-none focus:border-primary/50 transition-colors",
                  validationErrors.description && "border-red-500 focus:border-red-500"
                )}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
                {validationErrors.description && (
                  <p className="text-xs text-red-500 font-medium">
                    Inappropriate language detected
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto h-11"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:flex-1 h-11" 
                disabled={
                  isLoading || 
                  validationErrors.name || 
                  validationErrors.tag || 
                  validationErrors.description
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 w-4 h-4" />
                    Create Team
                  </>
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </>
  );

  if (isSheet) {
    return formContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 sm:h-10">
          <Plus className="mr-2 w-4 h-4" />
          <span className="hidden sm:inline">Create Team</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
