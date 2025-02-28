"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface Team {
  _id: string;
  name: string;
  tag: string;
  description: string;
}

export function TeamSettingsForm({ team }: { team: Team }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    tag: team.tag,
    description: team.description,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error("Failed to update team");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Team Name
        </label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Team Tag
        </label>
        <Input
          value={formData.tag}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, tag: e.target.value }))
          }
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Description
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="mt-1"
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Team"}
      </Button>
    </form>
  );
}
