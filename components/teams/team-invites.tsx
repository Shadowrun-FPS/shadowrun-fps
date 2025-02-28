"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

interface TeamInvite {
  _id: string;
  teamId: string;
  inviteeId: string;
  inviteeName: string;
  inviterId: string;
  inviterName: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
}

export function TeamInvites({ teamId }: { teamId: string }) {
  const [invites, setInvites] = useState<TeamInvite[]>([]);

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/invites`);
        const data = await response.json();
        setInvites(data);
      } catch (error) {
        console.error("Failed to fetch team invites:", error);
      }
    };

    fetchInvites();
  }, [teamId]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "accepted":
        return "bg-green-500/10 text-green-500";
      case "declined":
        return "bg-red-500/10 text-red-500";
      case "cancelled":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Recent Invites
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invites.length > 0 ? (
            invites.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="space-y-1">
                  <p className="font-medium">{invite.inviteeName}</p>
                  <p className="text-sm text-muted-foreground">
                    Invited by {invite.inviterName}
                  </p>
                </div>
                <Badge className={getStatusBadgeStyle(invite.status)}>
                  {invite.status.charAt(0).toUpperCase() +
                    invite.status.slice(1)}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent invites</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
