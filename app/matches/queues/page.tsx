"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { FeatureGate } from "@/components/feature-gate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  PlusCircle,
  Copy,
  UserMinus,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import io from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface QueuePlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
  joinedAt: number;
}

interface Queue {
  _id: string;
  queueId: string;
  gameType: "ranked";
  teamSize: number;
  players: QueuePlayer[];
  eloTier: "low" | "mid" | "high";
  minElo: number;
  maxElo: number;
  status: "active" | "inactive";
}

// Create queue form schema
const createQueueSchema = z.object({
  teamSize: z.enum(["1", "2", "4", "5"]),
  eloTier: z.enum(["low", "mid", "high"]),
  minElo: z.coerce.number().min(0).max(5000),
  maxElo: z.coerce.number().min(0).max(5000),
});

export default function QueuesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [queues, setQueues] = useState<Array<any>>([]);
  const [activeTab, setActiveTab] = useState<"4v4" | "5v5" | "2v2" | "1v1">(
    "4v4"
  );
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<{
    queueId: string;
    playerId: string;
    playerName: string;
  } | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isCheckingRegistration, setIsCheckingRegistration] =
    useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const router = useRouter();

  // Create queue form
  const form = useForm<z.infer<typeof createQueueSchema>>({
    resolver: zodResolver(createQueueSchema),
    defaultValues: {
      teamSize: "4",
      eloTier: "mid",
      minElo: 1000,
      maxElo: 2000,
    },
  });

  // Check if user is admin
  const isAdmin = () => {
    return (
      session?.user?.id === "238329746671271936" ||
      (session?.user?.roles && session?.user?.roles.includes("admin"))
    );
  };

  // Update the isAdmin function to also check for moderator role
  const isAdminOrMod = () => {
    return (
      session?.user?.id === "238329746671271936" ||
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("moderator")))
    );
  };

  useEffect(() => {
    if (!session?.user) return;

    // Initial fetch
    const fetchQueues = async () => {
      try {
        const response = await fetch("/api/queues");
        if (!response.ok) throw new Error("Failed to fetch queues");
        const data = await response.json();
        setQueues(data);
      } catch (error) {
        console.error("Error fetching queues:", error);
      }
    };

    fetchQueues();

    // Update the SSE connection logic
    const eventSource = new EventSource("/api/queues/events");
    console.log("Establishing SSE connection");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Ignore heartbeat messages
        if (data.type === "heartbeat") {
          return;
        }

        // Update queues if we received an array
        if (Array.isArray(data)) {
          setQueues(data);
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
        // The browser will automatically attempt to reconnect
      }, 1000);
    };

    return () => {
      console.log("Cleaning up SSE connection");
      eventSource.close();
    };
  }, [session?.user]);

  const handleJoinQueue = async (queueId: string) => {
    if (!session?.user) return;
    setJoiningQueue(queueId);

    // Don't do optimistic update with hardcoded ELO
    // Instead, let the SSE update handle it

    try {
      const response = await fetch(`/api/queues/${queueId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join queue");
      }

      toast({
        title: "Joined Queue",
        description: "You have joined the queue successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to join queue",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  const handleLeaveQueue = async (queueId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/queues/${queueId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to leave queue");
      }

      toast({
        title: "Success",
        description: "Successfully left queue",
      });
    } catch (error) {
      console.error("Error leaving queue:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to leave queue",
        variant: "destructive",
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  const isPlayerInQueue = (queue: Queue) => {
    return queue.players.some((p) => p.discordId === session?.user?.id);
  };

  const hasRequiredPlayers = (queue: Queue) => {
    const { activePlayers } = getQueueSections(queue);
    return activePlayers.length >= queue.teamSize * 2;
  };

  const handleLaunchMatch = async (queueId: string) => {
    console.log("Launch match attempt:", {
      sessionData: session,
      userId: session?.user?.id,
    });
    try {
      const response = await fetch(`/api/queues/${queueId}/launch`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to launch match");
      }

      const data = await response.json();

      // Redirect to the match detail page
      if (data.matchId) {
        router.push(`/matches/${data.matchId}`);
      }

      toast({
        title: "Match Launched",
        description: "The match has been created successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to launch match",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Update handleFillQueue to include reshuffle parameter
  const handleFillQueue = async (queueId: string, reshuffle = false) => {
    console.log("Fill queue attempt:", {
      sessionData: session,
      userId: session?.user?.id,
    });
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const url = reshuffle
        ? `/api/queues/${queueId}/fill?reshuffle=true`
        : `/api/queues/${queueId}/fill`;

      const response = await fetch(url, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fill queue");
      }

      toast({
        title: "Queue Filled",
        description: "The queue has been filled with random players",
        duration: 3000, // 3 seconds
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fill queue",
        variant: "destructive",
        duration: 3000, // 3 seconds
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  // Add this function after handleFillQueue
  const handleClearQueue = async (queueId: string) => {
    console.log("Clear queue attempt:", {
      sessionData: session,
      userId: session?.user?.id,
    });
    if (!session?.user) return;
    setJoiningQueue(queueId);

    try {
      const response = await fetch(`/api/queues/${queueId}/clear`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear queue");
      }

      toast({
        title: "Queue Cleared",
        description: "All players have been removed from the queue",
        duration: 3000, // 3 seconds
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to clear queue",
        variant: "destructive",
        duration: 3000, // 3 seconds
      });
    } finally {
      setJoiningQueue(null);
    }
  };

  // Add state for time updates
  const [, setTimeUpdate] = useState(0);

  // Update times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatJoinTime = (joinedAt: string | number | Date) => {
    try {
      // Handle different date formats and ensure valid date
      const date =
        typeof joinedAt === "number" ? new Date(joinedAt) : new Date(joinedAt);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "just now";
      }

      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "just now";
    }
  };

  // Update the getQueueSections helper to be more dynamic
  const getQueueSections = (queue: Queue) => {
    const requiredPlayers = queue.teamSize * 2;

    // Sort players by join time (first come, first served)
    const sortedPlayers = [...queue.players].sort(
      (a, b) => a.joinedAt - b.joinedAt
    );

    // First N players are active, rest are waitlisted
    const activePlayers = sortedPlayers.slice(0, requiredPlayers);
    const waitlistPlayers = sortedPlayers.slice(requiredPlayers);

    return { activePlayers, waitlistPlayers };
  };

  // Update the canLaunchMatch function to check for proper roles
  const canLaunchMatch = (queue: Queue) => {
    // Check if user has the required roles
    const hasRequiredRole =
      session?.user?.id === "238329746671271936" || // Your ID
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("moderator") ||
          session?.user?.roles.includes("founder") ||
          session?.user?.roles.includes("GM")));

    // Check if queue has enough players
    const hasEnoughPlayers = queue.players.length >= queue.teamSize * 2;

    return hasRequiredRole && hasEnoughPlayers;
  };

  // Handle create queue form submission
  const onSubmit = async (values: z.infer<typeof createQueueSchema>) => {
    if (!session?.user) return;

    setIsCreatingQueue(true);

    try {
      const response = await fetch("/api/queues/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamSize: parseInt(values.teamSize),
          eloTier: values.eloTier,
          minElo: values.minElo,
          maxElo: values.maxElo,
          gameType: "ranked",
          status: "active",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create queue");
      }

      toast({
        title: "Queue Created",
        description: "The queue has been created successfully",
        duration: 3000, // 3 seconds
      });

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create queue",
        variant: "destructive",
        duration: 3000, // 3 seconds
      });
    } finally {
      setIsCreatingQueue(false);
    }
  };

  // Update the handleRemovePlayer function to use the confirmation dialog
  const handleRemovePlayer = async (
    queueId: string,
    playerId: string,
    playerName: string
  ) => {
    // Set the player to remove, which will open the confirmation dialog
    setPlayerToRemove({ queueId, playerId, playerName });
  };

  // Add a function to confirm and execute the player removal
  const confirmRemovePlayer = async () => {
    if (!playerToRemove || !session?.user) return;

    setJoiningQueue(playerToRemove.queueId);

    try {
      const response = await fetch(
        `/api/queues/${playerToRemove.queueId}/remove-player`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerId: playerToRemove.playerId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove player");
      }

      toast({
        title: "Player Removed",
        description: `${playerToRemove.playerName} has been removed from the queue`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove player",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setJoiningQueue(null);
      setPlayerToRemove(null); // Close the dialog
    }
  };

  // Add a function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Queue ID has been copied to clipboard",
      duration: 3000,
    });
  };

  // Add state for waitlist expansion
  const [expandedWaitlists, setExpandedWaitlists] = useState<
    Record<string, boolean>
  >({});

  // Add a function to toggle waitlist expansion
  const toggleWaitlistExpansion = (queueId: string) => {
    setExpandedWaitlists((prev) => ({
      ...prev,
      [queueId]: !prev[queueId],
    }));
  };

  // Add a media query hook to detect mobile devices
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Wrap checkUserRegistration with useCallback
  const checkUserRegistration = useCallback(async () => {
    if (!session?.user) return;

    setIsCheckingRegistration(true);
    try {
      const response = await fetch(`/api/players/check-registration`);
      const data = await response.json();
      setIsRegistered(data.isRegistered);
    } catch (error) {
      console.error("Failed to check registration:", error);
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [session?.user]);

  // Now the useEffect will work correctly
  useEffect(() => {
    if (session?.user) {
      checkUserRegistration();
    }
  }, [session, checkUserRegistration]);

  // Add a function to handle registration
  const handleRegisterForRanked = async () => {
    if (!session?.user) return;

    setIsRegistering(true);
    try {
      const response = await fetch(`/api/players/register`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to register for ranked");
      }

      setIsRegistered(true);
      toast({
        title: "Registration Successful",
        description: "You have been registered for ranked matchmaking",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to register for ranked",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (!session) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please sign in to view queues</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FeatureGate feature="queues">
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ranked Matchmaking</CardTitle>
            {isAdmin() && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Queue</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Queue</DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="teamSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Size</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select team size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1v1</SelectItem>
                                <SelectItem value="2">2v2</SelectItem>
                                <SelectItem value="4">4v4</SelectItem>
                                <SelectItem value="5">5v5</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="eloTier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ELO Tier</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select ELO tier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="mid">Mid</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="minElo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min ELO</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxElo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max ELO</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={isCreatingQueue}>
                          {isCreatingQueue ? "Creating..." : "Create Queue"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!isRegistered && !isCheckingRegistration && (
              <div className="mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <h3 className="text-lg font-semibold">
                        Register for Ranked Matchmaking
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        You need to register before you can join ranked queues.
                      </p>
                      <Button
                        onClick={handleRegisterForRanked}
                        disabled={isRegistering}
                        className="w-full max-w-xs"
                      >
                        {isRegistering
                          ? "Registering..."
                          : "Register for Ranked"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {isMobile ? (
              <div className="mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-between w-full"
                    >
                      {activeTab === "4v4" && "4v4 Queues"}
                      {activeTab === "5v5" && "5v5 Queues"}
                      {activeTab === "2v2" && "2v2 Queues"}
                      {activeTab === "1v1" && "1v1 Queues"}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem onClick={() => setActiveTab("4v4")}>
                      4v4 Queues
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("5v5")}>
                      5v5 Queues
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("2v2")}>
                      2v2 Queues
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("1v1")}>
                      1v1 Queues
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="mt-4">
                  {queues
                    .filter((queue) => {
                      if (activeTab === "4v4") return queue.teamSize === 4;
                      if (activeTab === "5v5") return queue.teamSize === 5;
                      if (activeTab === "2v2") return queue.teamSize === 2;
                      if (activeTab === "1v1") return queue.teamSize === 1;
                      return false;
                    })
                    .map((queue) => (
                      <ContextMenu key={queue._id}>
                        <ContextMenuTrigger>
                          <Card className="overflow-hidden min-h-[600px] flex flex-col">
                            <CardHeader className="bg-muted/50">
                              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                  <CardTitle className="text-lg">
                                    {queue.eloTier.charAt(0).toUpperCase() +
                                      queue.eloTier.slice(1)}{" "}
                                    Queue
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {queue.minElo} - {queue.maxElo} ELO
                                  </p>
                                </div>
                                {isPlayerInQueue(queue) ? (
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleLeaveQueue(queue._id)}
                                    disabled={joiningQueue === queue._id}
                                    size="sm"
                                  >
                                    Leave
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleJoinQueue(queue._id)}
                                    disabled={joiningQueue === queue._id}
                                    size="sm"
                                  >
                                    Join Queue
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 p-4 sm:p-6">
                              {/* Active Players List */}
                              <div className="flex-1 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-sm font-medium">
                                    Players
                                  </h4>
                                  <span className="text-sm text-muted-foreground">
                                    (
                                    {Math.min(
                                      queue.players.length,
                                      queue.teamSize * 2
                                    )}
                                    /{queue.teamSize * 2})
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {getQueueSections(queue).activePlayers
                                    .length > 0 ? (
                                    getQueueSections(queue).activePlayers.map(
                                      (player, index) => (
                                        <div
                                          key={player.discordId}
                                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 h-[60px]"
                                        >
                                          <div className="flex flex-col min-w-0">
                                            <div className="flex items-center">
                                              <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                #{index + 1}
                                              </span>
                                              <span className="text-sm truncate">
                                                {player.discordNickname}
                                              </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                              {formatJoinTime(player.joinedAt)}
                                            </span>
                                          </div>
                                          <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                            {player.elo}
                                          </span>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <p className="col-span-2 py-2 text-sm text-center text-muted-foreground">
                                      No players in queue
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Waitlist Section */}
                              <div className="pt-4 mb-4 border-t">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium">
                                      Waitlist
                                    </h4>
                                    <span className="text-sm text-muted-foreground">
                                      (
                                      {
                                        getQueueSections(queue).waitlistPlayers
                                          .length
                                      }
                                      )
                                    </span>
                                  </div>

                                  {getQueueSections(queue).waitlistPlayers
                                    .length > 3 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() =>
                                        toggleWaitlistExpansion(queue._id)
                                      }
                                    >
                                      {expandedWaitlists[queue._id] ? (
                                        <>
                                          <ChevronUp className="w-4 h-4 mr-1" />
                                          <span className="text-xs">
                                            Show Less
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-4 h-4 mr-1" />
                                          <span className="text-xs">
                                            Show All
                                          </span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>

                                {/* Desktop View: Scrollable Container */}
                                {!isMobile && (
                                  <div
                                    className={`grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto transition-all duration-300 ease-in-out ${
                                      expandedWaitlists[queue._id]
                                        ? "max-h-[300px]"
                                        : "max-h-[150px]"
                                    }`}
                                  >
                                    {getQueueSections(queue).waitlistPlayers
                                      .length > 0 ? (
                                      getQueueSections(
                                        queue
                                      ).waitlistPlayers.map((player, index) => (
                                        <div
                                          key={player.discordId}
                                          className="flex items-center justify-between p-2 rounded-lg bg-muted/20 h-[60px]"
                                        >
                                          <div className="flex flex-col min-w-0">
                                            <div className="flex items-center">
                                              <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                #
                                                {getQueueSections(queue)
                                                  .activePlayers.length +
                                                  index +
                                                  1}
                                              </span>
                                              <span className="text-sm truncate">
                                                {player.discordNickname}
                                              </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                              {formatJoinTime(player.joinedAt)}
                                            </span>
                                          </div>
                                          <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                            {player.elo}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="col-span-2 py-2 text-sm text-center text-muted-foreground">
                                        No players in waitlist
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Mobile View: Limited Display + Sheet */}
                                {isMobile && (
                                  <>
                                    <div className="grid grid-cols-1 gap-2 mb-2">
                                      {getQueueSections(queue)
                                        .waitlistPlayers.slice(0, 2)
                                        .map((player, index) => (
                                          <div
                                            key={player.discordId}
                                            className="flex items-center justify-between p-2 rounded-lg bg-muted/20 h-[60px]"
                                          >
                                            <div className="flex flex-col min-w-0">
                                              <div className="flex items-center">
                                                <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                  #
                                                  {getQueueSections(queue)
                                                    .activePlayers.length +
                                                    index +
                                                    1}
                                                </span>
                                                <span className="text-sm truncate">
                                                  {player.discordNickname}
                                                </span>
                                              </div>
                                              <span className="text-xs text-muted-foreground">
                                                {formatJoinTime(
                                                  player.joinedAt
                                                )}
                                              </span>
                                            </div>
                                            <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                              {player.elo}
                                            </span>
                                          </div>
                                        ))}

                                      {getQueueSections(queue).waitlistPlayers
                                        .length > 2 && (
                                        <Sheet>
                                          <SheetTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className="w-full h-[60px] flex items-center justify-center"
                                            >
                                              <Plus className="w-4 h-4 mr-2" />
                                              {getQueueSections(queue)
                                                .waitlistPlayers.length -
                                                2}{" "}
                                              more players
                                            </Button>
                                          </SheetTrigger>
                                          <SheetContent
                                            side="bottom"
                                            className="h-[80vh]"
                                          >
                                            <SheetHeader>
                                              <SheetTitle>Waitlist</SheetTitle>
                                              <SheetDescription>
                                                Players waiting to join the
                                                queue
                                              </SheetDescription>
                                            </SheetHeader>
                                            <div className="mt-4 grid gap-2 overflow-y-auto max-h-[calc(80vh-120px)]">
                                              {getQueueSections(
                                                queue
                                              ).waitlistPlayers.map(
                                                (player, index) => (
                                                  <div
                                                    key={player.discordId}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                                                  >
                                                    <div className="flex flex-col">
                                                      <div className="flex items-center">
                                                        <span className="mr-2 text-sm font-medium text-muted-foreground">
                                                          #
                                                          {getQueueSections(
                                                            queue
                                                          ).activePlayers
                                                            .length +
                                                            index +
                                                            1}
                                                        </span>
                                                        <span className="text-base">
                                                          {
                                                            player.discordNickname
                                                          }
                                                        </span>
                                                      </div>
                                                      <span className="text-sm text-muted-foreground">
                                                        {formatJoinTime(
                                                          player.joinedAt
                                                        )}
                                                      </span>
                                                    </div>
                                                    <span className="ml-2 text-base text-muted-foreground">
                                                      {player.elo}
                                                    </span>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </SheetContent>
                                        </Sheet>
                                      )}

                                      {getQueueSections(queue).waitlistPlayers
                                        .length === 0 && (
                                        <p className="py-2 text-sm text-center text-muted-foreground">
                                          No players in waitlist
                                        </p>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Launch and Fill Buttons */}
                              <div className="pt-4 mt-auto border-t">
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleLaunchMatch(queue._id)}
                                    disabled={
                                      !canLaunchMatch(queue) ||
                                      joiningQueue === queue._id
                                    }
                                    className="w-full"
                                  >
                                    {!hasRequiredPlayers(queue)
                                      ? `Waiting for ${
                                          queue.teamSize * 2 -
                                          queue.players.length
                                        } more players`
                                      : "Launch Match"}
                                  </Button>

                                  {/* Admin Buttons */}
                                  {isAdmin() && (
                                    <div className="flex flex-col gap-2 mt-2">
                                      <Button
                                        variant="secondary"
                                        onClick={() =>
                                          handleFillQueue(queue._id, true)
                                        }
                                        disabled={joiningQueue === queue._id}
                                        className="w-full"
                                      >
                                        Fill Queue
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleClearQueue(queue._id)
                                        }
                                        disabled={
                                          joiningQueue === queue._id ||
                                          queue.players.length === 0
                                        }
                                        className="w-full"
                                      >
                                        Clear Queue
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-64">
                          <ContextMenuItem
                            onClick={() => copyToClipboard(queue.queueId)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Queue ID
                          </ContextMenuItem>

                          {isAdminOrMod() && (
                            <>
                              <ContextMenuSeparator />
                              <ContextMenuSub>
                                <ContextMenuSubTrigger>
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Remove Player
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-48">
                                  {queue.players.length > 0 ? (
                                    queue.players.map(
                                      (player: QueuePlayer, index: number) => (
                                        <ContextMenuItem
                                          key={player.discordId}
                                          onClick={() =>
                                            handleRemovePlayer(
                                              queue._id,
                                              player.discordId,
                                              player.discordNickname
                                            )
                                          }
                                        >
                                          <span className="mr-2 text-xs font-medium text-muted-foreground">
                                            #{index + 1}
                                          </span>
                                          {player.discordNickname}
                                        </ContextMenuItem>
                                      )
                                    )
                                  ) : (
                                    <ContextMenuItem disabled>
                                      No players in queue
                                    </ContextMenuItem>
                                  )}
                                </ContextMenuSubContent>
                              </ContextMenuSub>
                            </>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                </div>
              </div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              >
                <TabsList className="grid w-full h-auto grid-cols-4">
                  <TabsTrigger
                    value="4v4"
                    className="py-2 text-sm sm:text-base"
                    onClick={() => setActiveTab("4v4")}
                  >
                    4v4
                  </TabsTrigger>
                  <TabsTrigger
                    value="5v5"
                    className="py-2 text-sm sm:text-base"
                    onClick={() => setActiveTab("5v5")}
                  >
                    5v5
                  </TabsTrigger>
                  <TabsTrigger
                    value="2v2"
                    className="py-2 text-sm sm:text-base"
                    onClick={() => setActiveTab("2v2")}
                  >
                    2v2
                  </TabsTrigger>
                  <TabsTrigger
                    value="1v1"
                    className="py-2 text-sm sm:text-base"
                    onClick={() => setActiveTab("1v1")}
                  >
                    1v1
                  </TabsTrigger>
                </TabsList>

                {["4v4", "5v5", "2v2", "1v1"].map((size) => (
                  <TabsContent key={size} value={size}>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {Array.isArray(queues) ? (
                        queues
                          .filter(
                            (queue) =>
                              queue?.teamSize === parseInt(size.charAt(0))
                          )
                          .map((queue) => (
                            <ContextMenu key={queue._id}>
                              <ContextMenuTrigger>
                                <Card className="overflow-hidden min-h-[600px] flex flex-col">
                                  <CardHeader className="bg-muted/50">
                                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                      <div>
                                        <CardTitle className="text-lg">
                                          {queue.eloTier
                                            .charAt(0)
                                            .toUpperCase() +
                                            queue.eloTier.slice(1)}{" "}
                                          Queue
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                          {queue.minElo} - {queue.maxElo} ELO
                                        </p>
                                      </div>
                                      {isPlayerInQueue(queue) ? (
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleLeaveQueue(queue._id)
                                          }
                                          disabled={joiningQueue === queue._id}
                                          size="sm"
                                        >
                                          Leave
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={() =>
                                            handleJoinQueue(queue._id)
                                          }
                                          disabled={joiningQueue === queue._id}
                                          size="sm"
                                        >
                                          Join Queue
                                        </Button>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="flex flex-col flex-1 p-4 sm:p-6">
                                    {/* Active Players List */}
                                    <div className="flex-1 mb-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-sm font-medium">
                                          Players
                                        </h4>
                                        <span className="text-sm text-muted-foreground">
                                          (
                                          {Math.min(
                                            queue.players.length,
                                            queue.teamSize * 2
                                          )}
                                          /{queue.teamSize * 2})
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {getQueueSections(queue).activePlayers
                                          .length > 0 ? (
                                          getQueueSections(
                                            queue
                                          ).activePlayers.map(
                                            (player, index) => (
                                              <div
                                                key={player.discordId}
                                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 h-[60px]"
                                              >
                                                <div className="flex flex-col min-w-0">
                                                  <div className="flex items-center">
                                                    <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                      #{index + 1}
                                                    </span>
                                                    <span className="text-sm truncate">
                                                      {player.discordNickname}
                                                    </span>
                                                  </div>
                                                  <span className="text-xs text-muted-foreground">
                                                    {formatJoinTime(
                                                      player.joinedAt
                                                    )}
                                                  </span>
                                                </div>
                                                <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                                  {player.elo}
                                                </span>
                                              </div>
                                            )
                                          )
                                        ) : (
                                          <p className="col-span-2 py-2 text-sm text-center text-muted-foreground">
                                            No players in queue
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Waitlist Section */}
                                    <div className="pt-4 mb-4 border-t">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-medium">
                                            Waitlist
                                          </h4>
                                          <span className="text-sm text-muted-foreground">
                                            (
                                            {
                                              getQueueSections(queue)
                                                .waitlistPlayers.length
                                            }
                                            )
                                          </span>
                                        </div>

                                        {getQueueSections(queue).waitlistPlayers
                                          .length > 3 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() =>
                                              toggleWaitlistExpansion(queue._id)
                                            }
                                          >
                                            {expandedWaitlists[queue._id] ? (
                                              <>
                                                <ChevronUp className="w-4 h-4 mr-1" />
                                                <span className="text-xs">
                                                  Show Less
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="w-4 h-4 mr-1" />
                                                <span className="text-xs">
                                                  Show All
                                                </span>
                                              </>
                                            )}
                                          </Button>
                                        )}
                                      </div>

                                      {/* Desktop View: Scrollable Container */}
                                      {!isMobile && (
                                        <div
                                          className={`grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto transition-all duration-300 ease-in-out ${
                                            expandedWaitlists[queue._id]
                                              ? "max-h-[300px]"
                                              : "max-h-[150px]"
                                          }`}
                                        >
                                          {getQueueSections(queue)
                                            .waitlistPlayers.length > 0 ? (
                                            getQueueSections(
                                              queue
                                            ).waitlistPlayers.map(
                                              (player, index) => (
                                                <div
                                                  key={player.discordId}
                                                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 h-[60px]"
                                                >
                                                  <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center">
                                                      <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                        #
                                                        {getQueueSections(queue)
                                                          .activePlayers
                                                          .length +
                                                          index +
                                                          1}
                                                      </span>
                                                      <span className="text-sm truncate">
                                                        {player.discordNickname}
                                                      </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                      {formatJoinTime(
                                                        player.joinedAt
                                                      )}
                                                    </span>
                                                  </div>
                                                  <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                                    {player.elo}
                                                  </span>
                                                </div>
                                              )
                                            )
                                          ) : (
                                            <p className="col-span-2 py-2 text-sm text-center text-muted-foreground">
                                              No players in waitlist
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {/* Mobile View: Limited Display + Sheet */}
                                      {isMobile && (
                                        <>
                                          <div className="grid grid-cols-1 gap-2 mb-2">
                                            {getQueueSections(queue)
                                              .waitlistPlayers.slice(0, 2)
                                              .map((player, index) => (
                                                <div
                                                  key={player.discordId}
                                                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 h-[60px]"
                                                >
                                                  <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center">
                                                      <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                        #
                                                        {getQueueSections(queue)
                                                          .activePlayers
                                                          .length +
                                                          index +
                                                          1}
                                                      </span>
                                                      <span className="text-sm truncate">
                                                        {player.discordNickname}
                                                      </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                      {formatJoinTime(
                                                        player.joinedAt
                                                      )}
                                                    </span>
                                                  </div>
                                                  <span className="ml-2 text-sm text-muted-foreground shrink-0">
                                                    {player.elo}
                                                  </span>
                                                </div>
                                              ))}

                                            {getQueueSections(queue)
                                              .waitlistPlayers.length > 2 && (
                                              <Sheet>
                                                <SheetTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className="w-full h-[60px] flex items-center justify-center"
                                                  >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    {getQueueSections(queue)
                                                      .waitlistPlayers.length -
                                                      2}{" "}
                                                    more players
                                                  </Button>
                                                </SheetTrigger>
                                                <SheetContent
                                                  side="bottom"
                                                  className="h-[80vh]"
                                                >
                                                  <SheetHeader>
                                                    <SheetTitle>
                                                      Waitlist
                                                    </SheetTitle>
                                                    <SheetDescription>
                                                      Players waiting to join
                                                      the queue
                                                    </SheetDescription>
                                                  </SheetHeader>
                                                  <div className="mt-4 grid gap-2 overflow-y-auto max-h-[calc(80vh-120px)]">
                                                    {getQueueSections(
                                                      queue
                                                    ).waitlistPlayers.map(
                                                      (player, index) => (
                                                        <div
                                                          key={player.discordId}
                                                          className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                                                        >
                                                          <div className="flex flex-col">
                                                            <div className="flex items-center">
                                                              <span className="mr-2 text-sm font-medium text-muted-foreground">
                                                                #
                                                                {getQueueSections(
                                                                  queue
                                                                ).activePlayers
                                                                  .length +
                                                                  index +
                                                                  1}
                                                              </span>
                                                              <span className="text-base">
                                                                {
                                                                  player.discordNickname
                                                                }
                                                              </span>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">
                                                              {formatJoinTime(
                                                                player.joinedAt
                                                              )}
                                                            </span>
                                                          </div>
                                                          <span className="ml-2 text-base text-muted-foreground">
                                                            {player.elo}
                                                          </span>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </SheetContent>
                                              </Sheet>
                                            )}

                                            {getQueueSections(queue)
                                              .waitlistPlayers.length === 0 && (
                                              <p className="py-2 text-sm text-center text-muted-foreground">
                                                No players in waitlist
                                              </p>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Launch and Fill Buttons */}
                                    <div className="pt-4 mt-auto border-t">
                                      <div className="flex flex-col gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() =>
                                            handleLaunchMatch(queue._id)
                                          }
                                          disabled={
                                            !canLaunchMatch(queue) ||
                                            joiningQueue === queue._id
                                          }
                                          className="w-full"
                                        >
                                          {!hasRequiredPlayers(queue)
                                            ? `Waiting for ${
                                                queue.teamSize * 2 -
                                                queue.players.length
                                              } more players`
                                            : "Launch Match"}
                                        </Button>

                                        {/* Admin Buttons */}
                                        {isAdmin() && (
                                          <div className="flex flex-col gap-2 mt-2">
                                            <Button
                                              variant="secondary"
                                              onClick={() =>
                                                handleFillQueue(queue._id, true)
                                              }
                                              disabled={
                                                joiningQueue === queue._id
                                              }
                                              className="w-full"
                                            >
                                              Fill Queue
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              onClick={() =>
                                                handleClearQueue(queue._id)
                                              }
                                              disabled={
                                                joiningQueue === queue._id ||
                                                queue.players.length === 0
                                              }
                                              className="w-full"
                                            >
                                              Clear Queue
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-64">
                                <ContextMenuItem
                                  onClick={() => copyToClipboard(queue.queueId)}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Queue ID
                                </ContextMenuItem>

                                {isAdminOrMod() && (
                                  <>
                                    <ContextMenuSeparator />
                                    <ContextMenuSub>
                                      <ContextMenuSubTrigger>
                                        <UserMinus className="w-4 h-4 mr-2" />
                                        Remove Player
                                      </ContextMenuSubTrigger>
                                      <ContextMenuSubContent className="w-48">
                                        {queue.players.length > 0 ? (
                                          queue.players.map(
                                            (
                                              player: QueuePlayer,
                                              index: number
                                            ) => (
                                              <ContextMenuItem
                                                key={player.discordId}
                                                onClick={() =>
                                                  handleRemovePlayer(
                                                    queue._id,
                                                    player.discordId,
                                                    player.discordNickname
                                                  )
                                                }
                                              >
                                                <span className="mr-2 text-xs font-medium text-muted-foreground">
                                                  #{index + 1}
                                                </span>
                                                {player.discordNickname}
                                              </ContextMenuItem>
                                            )
                                          )
                                        ) : (
                                          <ContextMenuItem disabled>
                                            No players in queue
                                          </ContextMenuItem>
                                        )}
                                      </ContextMenuSubContent>
                                    </ContextMenuSub>
                                  </>
                                )}
                              </ContextMenuContent>
                            </ContextMenu>
                          ))
                      ) : (
                        <div>Loading queues...</div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
        {playerToRemove && (
          <AlertDialog
            open={!!playerToRemove}
            onOpenChange={() => setPlayerToRemove(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Player</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {playerToRemove.playerName}{" "}
                  from the queue? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRemovePlayer}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {process.env.NODE_ENV === "development" && (
          <div className="hidden">
            <pre>
              {JSON.stringify(
                {
                  session: session,
                  userId: session?.user?.id,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
