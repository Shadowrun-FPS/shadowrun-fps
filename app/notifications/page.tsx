"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamInvite {
  _id: string;
  teamId: string;
  teamName: string;
  invitedById: string;
  invitedByName: string;
  invitedAt: Date;
  status: "pending" | "accepted" | "declined";
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const response = await fetch("/api/notifications/team-invites");
        if (!response.ok) throw new Error("Failed to fetch invites");
        const data = await response.json();
        setInvites(data);
      } catch (error) {
        console.error("Failed to fetch invites:", error);
        toast({
          title: "Error",
          description: "Failed to load team invites",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchInvites();
    }
  }, [session?.user, toast]);

  const handleInviteResponse = async (inviteId: string, accept: boolean) => {
    try {
      const response = await fetch(
        `/api/notifications/team-invites/${inviteId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accept }),
        }
      );

      if (!response.ok) throw new Error("Failed to respond to invite");

      // Update local state
      setInvites((prev) => prev.filter((invite) => invite._id !== inviteId));

      toast({
        title: accept ? "Invite Accepted" : "Invite Declined",
        description: accept
          ? "You have joined the team"
          : "You have declined the team invite",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to invite",
        variant: "destructive",
      });
    }
  };

  if (!session) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please sign in to view notifications</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="team-invites">
            <TabsList>
              <TabsTrigger value="team-invites">Team Invites</TabsTrigger>
            </TabsList>
            <TabsContent value="team-invites">
              {loading ? (
                <p className="text-center py-4">Loading invites...</p>
              ) : invites.length > 0 ? (
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <Card key={invite._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{invite.teamName}</p>
                            <p className="text-sm text-muted-foreground">
                              Invited by {invite.invitedByName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleInviteResponse(invite._id, false)
                              }
                            >
                              Decline
                            </Button>
                            <Button
                              onClick={() =>
                                handleInviteResponse(invite._id, true)
                              }
                            >
                              Accept
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4">No pending team invites</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
