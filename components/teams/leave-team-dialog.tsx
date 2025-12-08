"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { LogOut, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LeaveTeamDialogProps {
  teamId: string;
  teamName: string;
}

export function LeaveTeamDialog({ teamId, teamName }: LeaveTeamDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  // Removed debug console.log

  const handleLeaveTeam = async () => {
    if (isLoading) return; // Prevent duplicate submissions
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave team");
      }

      toast({
        title: "Team Left",
        description: `You have successfully left the team "${teamName}".`,
      });

      router.refresh();
      // Redirect to teams page or dashboard
      window.location.href = "/teams";
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error leaving team:", error);
      }
      toast({
        title: "Error",
        description:
          error.message || "Failed to leave the team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <LogOut className="w-5 h-5 mr-2" />
            Leave Team Now
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Leave Team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{teamName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md text-red-700 dark:text-red-400 text-sm mt-2">
            <p>
              You will lose access to this team and will need an invitation to
              rejoin.
            </p>
          </div>
          <DialogFooter className="sm:justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveTeam}
              disabled={isLoading}
              className="ml-2"
            >
              {isLoading ? "Leaving..." : "Leave Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        size="sm"
        className="mt-2 text-muted-foreground"
      >
        <LogOut className="w-4 h-4 mr-1" />
        Leave Team (Alternate)
      </Button>
    </>
  );
}
