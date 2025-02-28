"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface TeamInvite {
  _id: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  createdAt: string;
}

export function TeamInvites() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/notifications/team-invites");
      if (!response.ok) throw new Error("Failed to fetch invites");
      const data = await response.json();
      setInvites(data);
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleInviteResponse = async (inviteId: string, accept: boolean) => {
    try {
      const response = await fetch(`/api/teams/invites/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });

      if (!response.ok) throw new Error("Failed to respond to invite");

      toast({
        title: accept ? "Invite Accepted" : "Invite Declined",
        description: accept
          ? "You have joined the team"
          : "You have declined the team invitation",
      });

      // Refresh invites
      fetchInvites();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to invite",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invites.map((invite) => (
        <Card key={invite._id}>
          <CardHeader>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              {invite.inviterName} has invited you to join {invite.teamName}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleInviteResponse(invite._id, true)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleInviteResponse(invite._id, false)}
            >
              Decline
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
