"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface TeamInviteCardProps {
  id: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  inviterNickname: string;
  createdAt: string;
  onInviteProcessed?: () => void;
}

export function TeamInviteCard({
  id,
  teamId,
  teamName,
  inviterName,
  inviterNickname,
  createdAt,
  onInviteProcessed,
}: TeamInviteCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(
    "pending"
  );
  const { toast } = useToast();
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAction = async (action: "accept" | "reject") => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/invites/${id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process invite");
      }

      const statusValue = action === "accept" ? "accepted" : "rejected";
      setStatus(statusValue);
      setProcessed(true);

      toast({
        title: action === "accept" ? "Team Joined" : "Invite Rejected",
        description: data.message,
        variant: action === "accept" ? "default" : "destructive",
      });

      if (action === "accept") {
        // Redirect to team page
        setTimeout(() => {
          router.push(`/tournaments/teams/${teamId}`);
          router.refresh();
        }, 1500);
      }

      if (onInviteProcessed) {
        onInviteProcessed();
      }
    } catch (error: any) {
      console.error(`Error ${action}ing invite:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} invite`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Team Invite</h3>
        </div>

        <p className="mb-1 text-sm">
          You have been invited to join team{" "}
          <span className="font-semibold">{teamName}</span>
        </p>

        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p>Invited by: {inviterNickname || inviterName}</p>
          <p>Date: {formatDate(createdAt)}</p>
        </div>
      </CardContent>

      {!processed && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction("reject")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            Decline
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleAction("accept")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Accept
          </Button>
        </CardFooter>
      )}

      {processed && (
        <CardFooter className="pt-2">
          <p className="w-full py-2 text-sm text-center">
            {status === "accepted" ? (
              <span className="font-medium text-green-500">
                Invite accepted. Joining team...
              </span>
            ) : (
              <span className="text-muted-foreground">Invite declined</span>
            )}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
