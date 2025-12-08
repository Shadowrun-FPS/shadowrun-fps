"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isCaptain = session?.user?.id === team.captain.discordId;

  const handleRemoveMember = async (memberId: string) => {
    if (!isCaptain || isLoading) return; // Prevent duplicate submissions

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

      router.refresh();
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

  const handleDeleteTeam = async () => {
    if (!isCaptain) return;

    // Check if there are other members
    const hasOtherMembers =
      team.members.filter((m: any) => m.role !== "captain").length > 0;
    if (hasOtherMembers) {
      toast({
        title: "Cannot Delete Team",
        description:
          "You must remove all other members before deleting the team",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return; // Prevent duplicate submissions

    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to permanently delete this team? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team._id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete team");

      toast({
        title: "Team Deleted",
        description: "Your team has been permanently deleted",
      });

      router.refresh();
      // Redirect to teams page
      window.location.href = "/tournaments/teams";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team",
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
          {isCaptain &&
            team.members.filter((m: any) => m.role !== "captain").length ===
              0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-red-500 mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Since you have no other team members, you can permanently
                  delete this team.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteTeam}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Deleting..." : "Delete Team Permanently"}
                </Button>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
