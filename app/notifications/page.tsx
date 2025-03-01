"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns/formatDistance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import type { Notification } from "@/types/notifications";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const response = await fetch("/api/notifications");
    const data = await response.json();
    setNotifications(data);
  };

  const handleResponse = async (
    notificationId: string,
    action: "accept" | "decline"
  ) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.message) {
          setError(data.message);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to respond to notification",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: action === "accept" ? "Accepted" : "Declined",
        description:
          action === "accept"
            ? "You have successfully joined the team!"
            : "You have declined the invitation",
      });

      fetchNotifications();
    } catch (error) {
      console.error("Failed to respond to notification:", error);
      toast({
        title: "Error",
        description: "Failed to respond to notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TEAM_INVITE":
        return "👥";
      case "MATCH_READY":
        return "🎮";
      case "MATCH_COMPLETE":
        return "🏆";
      default:
        return "📬";
    }
  };

  const filteredNotifications =
    activeTab === "pending"
      ? notifications.filter((n) => n.status === "PENDING")
      : notifications;

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container py-8 mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <Badge variant="secondary">
              {notifications.filter((n) => n.status === "PENDING").length}{" "}
              pending
            </Badge>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "pending" | "all")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="all">All Notifications</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center p-6">
                    <p className="text-muted-foreground">No notifications</p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card key={notification._id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                          <p className="mb-1">{notification.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistance(
                              new Date(notification.createdAt),
                              new Date(),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                          {notification.status !== "PENDING" && (
                            <Badge
                              variant={
                                notification.status === "ACCEPTED"
                                  ? "default"
                                  : "destructive"
                              }
                              className="mt-2"
                            >
                              {notification.status.toLowerCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {notification.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              handleResponse(notification._id, "accept")
                            }
                            variant="default"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() =>
                              handleResponse(notification._id, "decline")
                            }
                            variant="destructive"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot Join Team</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setError(null)}>Okay</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
