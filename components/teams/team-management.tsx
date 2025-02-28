"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteMemberDialog } from "./invite-member-dialog";
import { useToast } from "@/components/ui/use-toast";

interface TeamManagementProps {
  team: any; // Type this properly based on your team structure
}

export function TeamManagement({ team }: TeamManagementProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isCaptain = session?.user?.id === team.captain.discordId;

  const handleRemoveMember = async (memberId: string) => {
    if (!isCaptain) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team._id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          requesterId: session?.user?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove member");

      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
      });

      // Refresh the page to show updated team
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCaptain) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <InviteMemberDialog teamId={team._id} />
          <div className="space-y-2">
            {team.members
              .filter((m: any) => m.role !== "captain")
              .map((member: any) => (
                <div
                  key={member.discordId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span>{member.discordNickname}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.discordId)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
