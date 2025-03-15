"use client";

import React from "react";
import { TeamInviteCard } from "@/components/notifications/team-invite-card";
import { Card, CardContent } from "@/components/ui/card";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  metadata: any;
}

interface NotificationListProps {
  notifications: Notification[];
  onAction: (notificationId: string, action: string) => void;
}

export function NotificationList({
  notifications,
  onAction,
}: NotificationListProps) {
  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No notifications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        // Render different notification types
        if (notification.type === "team_invite") {
          return (
            <TeamInviteCard
              key={notification._id}
              notification={notification}
              onAction={onAction}
            />
          );
        }

        // Default notification card for other types
        return (
          <Card key={notification._id} className="mb-4">
            <CardContent className="py-4">
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
