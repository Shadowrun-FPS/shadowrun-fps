"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useNotifications } from "@/contexts/NotificationsContext";

interface TeamInviteCardProps {
  notification: {
    _id: string;
    title: string;
    message: string;
    createdAt: string;
    metadata: {
      teamId: string;
      teamName: string;
      inviteId: string;
    };
  };
  onAction: (notificationId: string, action: string) => void;
}

export function TeamInviteCard({
  notification,
  onAction,
}: TeamInviteCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { markAsRead } = useNotifications();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/invites/${notification.metadata.inviteId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invite");
      }

      toast({
        title: "Invite Accepted",
        description: `You have joined ${notification.metadata.teamName}`,
      });

      // Mark notification as read automatically
      await markAsRead(notification._id);

      // Mark notification as handled
      onAction(notification._id, "accepted");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/invites/${notification.metadata.inviteId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject invite");
      }

      toast({
        title: "Invite Rejected",
        description: "You have declined the team invitation",
      });

      // Mark notification as read automatically
      await markAsRead(notification._id);

      // Mark notification as handled
      onAction(notification._id, "rejected");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">{notification.title}</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <p>{notification.message}</p>
        <p className="text-sm font-medium mt-2">
          Team: {notification.metadata.teamName}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReject} disabled={isLoading}>
          Decline
        </Button>
        <Button onClick={handleAccept} disabled={isLoading}>
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
