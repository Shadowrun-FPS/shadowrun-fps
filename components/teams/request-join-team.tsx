"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RequestJoinTeamProps {
  teamId: string;
  teamName: string;
}

export function RequestJoinTeam({ teamId, teamName }: RequestJoinTeamProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingTeam, setIsCheckingTeam] = useState(true);
  const [isAlreadyInTeam, setIsAlreadyInTeam] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<{ name: string } | null>(null);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    const checkTeamStatus = async () => {
      if (!session?.user) {
        setIsCheckingTeam(false);
        return;
      }

      setIsCheckingTeam(true);
      try {
        console.log("Checking team status for user:", session.user.id);
        const response = await fetch(`/api/teams/my-team`);

        if (!response.ok) {
          console.error(
            "Error response from /api/teams/my-team:",
            response.status
          );
          throw new Error(`Failed to check team status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Team check response:", data);

        if (data.team) {
          console.log("User is already in team:", data.team.name);
          setIsAlreadyInTeam(true);
          setCurrentTeam(data.team);
        } else {
          console.log("User is not in any team");
          setIsAlreadyInTeam(false);
          setCurrentTeam(null);
        }
      } catch (error) {
        console.error("Error checking team status:", error);
        toast({
          variant: "destructive",
          title: "Error checking team status",
          description:
            "Could not verify your team membership. Please try again later.",
        });
      } finally {
        setIsCheckingTeam(false);
      }
    };

    checkTeamStatus();
  }, [session, status, toast]);

  const handleRequestJoin = async () => {
    if (isAlreadyInTeam) {
      toast({
        variant: "destructive",
        title: "Already in a team",
        description: `You are already a member of ${currentTeam?.name}. Leave your current team to join another.`,
      });
      return;
    }

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

  if (isCheckingTeam) {
    return (
      <Button disabled className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking Status...
      </Button>
    );
  }

  if (isAlreadyInTeam) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                disabled={true}
                className="flex items-center gap-2 cursor-not-allowed"
              >
                <UserPlus className="h-4 w-4" />
                Request to Join
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              You are already a member of {currentTeam?.name}. Leave your
              current team to join another.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      onClick={handleRequestJoin}
      disabled={isLoading || isAlreadyInTeam}
      className="flex items-center gap-2"
    >
      <UserPlus className="h-4 w-4" />
      {isLoading ? "Sending Request..." : "Request to Join"}
    </Button>
  );
}
