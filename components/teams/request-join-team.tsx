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
  teamSize?: number;
}

export function RequestJoinTeam({ teamId, teamName, teamSize }: RequestJoinTeamProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingTeam, setIsCheckingTeam] = useState(true);
  const [isAlreadyInTeam, setIsAlreadyInTeam] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<{ name: string; teamSize?: number } | null>(null);
  const [isSameSizeTeam, setIsSameSizeTeam] = useState(false);
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
          const userTeamSize = data.team.teamSize || 4;
          const targetTeamSize = teamSize || 4;
          
          // Only block if user is in a team of the same size
          if (userTeamSize === targetTeamSize) {
            setIsAlreadyInTeam(true);
            setIsSameSizeTeam(true);
            setCurrentTeam(data.team);
          } else {
            setIsAlreadyInTeam(false);
            setIsSameSizeTeam(false);
            setCurrentTeam(data.team);
          }
        } else {
          console.log("User is not in any team");
          setIsAlreadyInTeam(false);
          setIsSameSizeTeam(false);
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
  }, [session, status, toast, teamSize]);

  const handleRequestJoin = async () => {
    if (isAlreadyInTeam && isSameSizeTeam) {
      const targetTeamSize = teamSize || 4;
      toast({
        variant: "destructive",
        title: "Already in a team",
        description: `You are already a member of a ${targetTeamSize}-person team "${currentTeam?.name}". Leave your current team to join another team of the same size.`,
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

  if (isAlreadyInTeam && isSameSizeTeam) {
    const targetTeamSize = teamSize || 4;
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
              You are already a member of a {targetTeamSize}-person team &quot;{currentTeam?.name}&quot;. Leave your
              current team to join another team of the same size.
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
