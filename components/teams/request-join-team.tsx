"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";

interface RequestJoinTeamProps {
  teamId: string;
  teamName: string;
}

export function RequestJoinTeam({ teamId, teamName }: RequestJoinTeamProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRequestJoin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/join-request`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to request to join team");
      }

      toast({
        title: "Request Sent",
        description: `Your request to join ${teamName} has been sent to the team captain.`,
      });
    } catch (error: any) {
      console.error("Error requesting to join team:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRequestJoin}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <UserPlus className="h-4 w-4" />
      {isLoading ? "Sending Request..." : "Request to Join"}
    </Button>
  );
}
