"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Shield, Users, FileText, Save, Loader2, Edit, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { containsProfanity } from "@/lib/profanity-filter";

interface Team {
  _id: string;
  name: string;
  tag: string;
  description: string;
  createdAt?: string;
}

interface TeamSettingsFormProps {
  team: Team;
  formatDate?: (dateString: string | undefined) => string;
}

export function TeamSettingsForm({ team, formatDate }: TeamSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    tag: team.tag,
    description: team.description,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const response = await fetch(`/api/teams/${team._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update team");
      }

      toast({
        title: "Team Updated",
        description: "Your team settings have been updated successfully",
        duration: 2000,
      });

      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating team:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original team values
    setFormData({
      name: team.name,
      tag: team.tag,
      description: team.description,
    });
    setIsEditing(false);
  };

  // Read-only view (default)
  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Team Name
          </h3>
          <p className="text-xl font-semibold">{team.name}</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Team Tag
          </h3>
          <Badge variant="secondary" className="text-lg">
            [{team.tag}]
          </Badge>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Description
          </h3>
          <p className="text-muted-foreground">
            {team.description || "No description available"}
          </p>
        </div>

        {team.createdAt && formatDate && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Created
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(team.createdAt)}
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            className="h-11 w-full sm:w-auto"
          >
            <Edit className="mr-2 w-4 h-4" />
            Edit Team Details
          </Button>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Team Name
        </label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="h-11 border-2"
          maxLength={50}
          placeholder="Enter team name"
        />
        <p className="text-xs text-muted-foreground">
          {formData.name.length}/50 characters
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Team Tag
        </label>
        <Input
          value={formData.tag}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, tag: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))
          }
          className="h-11 border-2 font-mono text-lg"
          maxLength={4}
          placeholder="Enter team tag"
        />
        <p className="text-xs text-muted-foreground">
          Up to 4 uppercase letters or numbers
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Description
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="min-h-[100px] border-2 resize-none"
          maxLength={500}
          placeholder="Enter team description"
        />
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-11 w-full sm:w-auto"
        >
          <X className="mr-2 w-4 h-4" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-11 w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="mr-2 w-4 h-4" />
              Update Team
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
