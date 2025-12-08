"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamInvite {
  inviterNickname: string;
  _id: string;
  teamId: string;
  inviteeId: string;
  inviteeName: string;
  inviterId: string;
  inviterName: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
}

export function TeamInvites({
  teamId,
  isCaptain = false,
}: {
  teamId: string;
  isCaptain?: boolean;
}) {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invites`);
      const data = await response.json();
      setInvites(data.invites || []);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch team invites:", error);
      }
    }
  }, [teamId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

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

  const handleClearAllInvites = async () => {
    setShowClearDialog(true);
  };

  const confirmClearInvites = async () => {
    if (isClearing) return; // Prevent duplicate submissions
    setIsClearing(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invites/clear`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clear invites");
      }

      setInvites([]);
      toast({
        title: "Invites Cleared",
        description: "All invites have been cleared successfully",
      });
      router.refresh();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error clearing invites:", error);
      }
      toast({
        title: "Error",
        description: "Failed to clear invites",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
      setShowClearDialog(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Recent Invites
        </CardTitle>
        {isCaptain && invites.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllInvites}
            disabled={isClearing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
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
                    Invited by {invite.inviterNickname || invite.inviterName}
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

      {/* Clear All Invites Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Invites</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all invites? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearInvites}
              disabled={isClearing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isClearing ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
