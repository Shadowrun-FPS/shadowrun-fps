"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

// Mock data for demonstration
const recentActions = [
  {
    id: "1",
    type: "warning",
    player: "ToxicPlayer",
    moderator: "AdminUser",
    reason: "Inappropriate language in chat",
    timestamp: "2024-02-28T14:30:00Z",
  },
  {
    id: "2",
    type: "ban",
    player: "BannedUser",
    moderator: "ModeratorUser",
    reason: "Repeated violations of community guidelines",
    duration: "7 days",
    timestamp: "2024-02-27T10:15:00Z",
  },
  {
    id: "3",
    type: "ban",
    player: "PermaBanned",
    moderator: "AdminUser",
    reason: "Cheating in tournament",
    duration: "Permanent",
    timestamp: "2024-02-25T18:45:00Z",
  },
];

const activeBans = [
  {
    id: "1",
    player: "BannedUser",
    reason: "Repeated violations of community guidelines",
    moderator: "ModeratorUser",
    startDate: "2024-02-27T10:15:00Z",
    endDate: "2024-03-05T10:15:00Z",
  },
  {
    id: "2",
    player: "PermaBanned",
    reason: "Cheating in tournament",
    moderator: "AdminUser",
    startDate: "2024-02-25T18:45:00Z",
    endDate: null,
  },
];

// Add mock disputes data
const mockDisputes = [
  {
    id: 1,
    logId: "log-1",
    player: "Player1",
    reason: "Unfair ban",
    status: "Pending",
  },
  {
    id: 2,
    logId: "log-2",
    player: "Player2",
    reason: "Incorrect warning",
    status: "Pending",
  },
  // Add more mock disputes as needed
];

export function ModerationDashboard() {
  const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (endDate: string | Date | null): string => {
    if (!endDate) return "Permanent";

    const end = new Date(endDate);
    const now = new Date();

    // Convert Date objects to timestamps for arithmetic
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h remaining`;
  };

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="active-bans">Active Bans</TabsTrigger>
        <TabsTrigger value="recent-actions">Recent Actions</TabsTrigger>
        <TabsTrigger value="disputes">Disputes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Warnings
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="w-4 h-4 text-yellow-500"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +5 from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Bans</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="w-4 h-4 text-destructive"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Moderation Actions
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="w-4 h-4 text-primary"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">
                +12 from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Moderation Actions</CardTitle>
            <CardDescription>
              The latest warnings and bans issued on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Moderator
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      {action.type === "warning" ? (
                        <Badge
                          variant="outline"
                          className="text-yellow-500 border-yellow-500"
                        >
                          Warning
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Ban {action.duration && `(${action.duration})`}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {action.player}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {action.moderator}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {action.reason}
                    </TableCell>
                    <TableCell>{formatDate(action.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="active-bans">
        <Card>
          <CardHeader>
            <CardTitle>Active Bans</CardTitle>
            <CardDescription>
              Currently banned players and their remaining ban duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Moderator
                  </TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    End Date
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeBans.map((ban) => (
                  <TableRow key={ban.id}>
                    <TableCell className="font-medium">{ban.player}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {ban.reason}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {ban.moderator}
                    </TableCell>
                    <TableCell>{formatDate(ban.startDate)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {ban.endDate ? formatDate(ban.endDate) : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ban.endDate ? "default" : "destructive"}
                        className="whitespace-nowrap"
                      >
                        {getTimeRemaining(ban.endDate)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recent-actions">
        <Card>
          <CardHeader>
            <CardTitle>Recent Moderation Actions</CardTitle>
            <CardDescription>
              A detailed view of all recent moderation actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Moderator
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Duration
                  </TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      {action.type === "warning" ? (
                        <Badge
                          variant="outline"
                          className="text-yellow-500 border-yellow-500"
                        >
                          Warning
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Ban</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {action.player}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {action.moderator}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {action.reason}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {action.duration || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(action.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="disputes">
        <Card>
          <CardHeader>
            <CardTitle>Moderation Disputes</CardTitle>
            <CardDescription>
              Review and resolve player disputes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log ID</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>{dispute.logId}</TableCell>
                    <TableCell>{dispute.player}</TableCell>
                    <TableCell>{dispute.reason}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dispute.status === "Pending" ? "outline" : "secondary"
                        }
                      >
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dispute.status === "Pending" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-8 h-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Remove Ban</DropdownMenuItem>
                            <DropdownMenuItem>Edit Ban</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
