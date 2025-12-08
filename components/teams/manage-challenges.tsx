"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define types for the challenge object
interface Challenge {
  _id: string;
  challengerTeamId: string;
  challengedTeam: {
    name: string;
  };
  challengerTeam: {
    name: string;
    captain?: {
      discordId: string;
    };
  };
  proposedDate: string | Date;
  selectedMaps: any[];
  message?: string;
}

export function ManageChallenges({ teamId }: { teamId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/scrimmages/challenges?teamId=${teamId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch challenges");
        }
        const data = await response.json();
        setChallenges(data);
      } catch (error) {
        console.error("Error fetching challenges:", error);
        toast({
          title: "Error",
          description: "Failed to load challenges",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [teamId]);

  const handleCancelChallenge = async () => {
    if (!selectedChallenge) return;

    try {
      setIsCancelling(true);

      const response = await fetch(
        `/api/scrimmages/${selectedChallenge._id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel challenge");
      }

      // Remove the cancelled challenge from the list
      setChallenges((prev) =>
        prev.filter((c) => c._id !== selectedChallenge._id)
      );

      toast({
        title: "Challenge cancelled",
        description: "The challenge has been cancelled successfully.",
      });

      router.refresh();
      setCancelDialogOpen(false);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error cancelling challenge:", error);
      }
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to cancel challenge",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResendChallenge = async (challenge: Challenge) => {
    try {
      const response = await fetch(`/api/scrimmages/${challenge._id}/resend`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resend challenge");
      }

      toast({
        title: "Challenge resent",
        description: "The challenge has been resent successfully.",
      });
    } catch (error) {
      console.error("Error resending challenge:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to resend challenge",
        variant: "destructive",
      });
    }
  };

  // Check if user is team captain
  const isTeamCaptain =
    challenges.length > 0 &&
    challenges[0].challengerTeam?.captain?.discordId === session?.user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">No pending challenges</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Pending Challenges</h3>

      {challenges.map((challenge) => (
        <Card key={challenge._id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {challenge.challengerTeamId === teamId
                ? `Challenge to ${challenge.challengedTeam.name}`
                : `Challenge from ${challenge.challengerTeam.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>
                  {format(new Date(challenge.proposedDate), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {format(new Date(challenge.proposedDate), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{challenge.selectedMaps.length} maps selected</span>
              </div>
            </div>

            {challenge.message && (
              <div className="p-3 mt-3 rounded-md bg-muted">
                <p className="text-sm italic">
                  &quot;{challenge.message}&quot;
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {isTeamCaptain && challenge.challengerTeamId === teamId && (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleResendChallenge(challenge)}
                >
                  Resend
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setCancelDialogOpen(true);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      ))}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Challenge</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this challenge? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              No, keep it
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelChallenge}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, cancel challenge"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
