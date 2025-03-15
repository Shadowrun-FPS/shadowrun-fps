"use client";

import { useNotifications } from "@/contexts/NotificationsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NotificationsDebug() {
  const { notifications, unreadCount, fetchNotifications, resetUnreadCount } =
    useNotifications();

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Notifications Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">Unread Count: {unreadCount}</p>
          <p className="font-medium">
            Total Notifications: {notifications.length}
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-2">Raw Notifications Data:</h3>
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
            {JSON.stringify(notifications, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => fetchNotifications()}>
            Refresh Notifications
          </Button>
          <Button variant="destructive" onClick={() => resetUnreadCount()}>
            Reset Count to 0
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
