"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CalendarIcon,
  MapPin,
  Clock,
  Shield,
  Loader2,
  Check,
  X,
  ChevronDown,
  Trophy,
  Timer,
  Map,
  Sword,
  SwordIcon,
  Swords,
} from "lucide-react";
import { format, addDays, nextSaturday } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Team {
  _id: string;
  name: string;
  tag?: string;
  captain: {
    discordId: string;
    discordNickname?: string;
    discordUsername?: string;
    discordProfilePicture?: string;
  };
  members: any[];
}

interface MapItem {
  _id: string;
  name: string;
  image?: string;
  gameMode: string;
  isSmallVariant: boolean;
  smallOption?: boolean;
  originalId?: string;
  variant?: string;
}

interface MapSelection {
  gameMode: string;
  id: string; // Map ObjectId
  name: string; // Map name
  isSmallVariant: boolean; // Whether this is a small variant
  image?: string; // Map image path
}

interface ChallengeTeamDialogProps {
  team: {
    _id: string;
    name: string;
    tag: string;
    captain: any;
    members: any[];
  };
  userTeam: any;
  disabled?: boolean;
}

export function ChallengeTeamDialog({
  team,
  userTeam,
  disabled,
}: ChallengeTeamDialogProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeOption, setTimeOption] = useState("evening");
  const [customTime, setCustomTime] = useState("19:00");
  const [selectedMaps, setSelectedMaps] = useState<MapSelection[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapSelectionMethod, setMapSelectionMethod] = useState("manual");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Check if user is team captain
  const isTeamCaptain = session?.user?.id === userTeam?.captain?.discordId;

  // Set default dates for suggested times
  const tomorrow = addDays(new Date(), 1);
  const weekend = nextSaturday(new Date());

  // Add check for team size
  const canChallenge = team.members.length >= 4;

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      setDate(undefined);
      setTimeOption("evening");
      setCustomTime("19:00");
      setSelectedMaps([]);
      setMessage("");
      setActiveTab("details");
      setMapSelectionMethod("manual");
    }
  }, [open]);

  // Fetch maps from the database
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/maps");
        if (!response.ok) {
          throw new Error("Failed to fetch maps");
        }
        const data = await response.json();

        // Process maps to include small variants
        const processedMaps: MapItem[] = [];
        data.forEach((map: any) => {
          // Add the regular map
          processedMaps.push({
            _id: map._id,
            name: map.name,
            image: `/maps/map_${map.name
              .toLowerCase()
              .replace(/\s+/g, "")}.png`,
            gameMode: map.gameMode || "Standard",
            isSmallVariant: false,
            smallOption: map.smallOption,
            originalId: map._id,
          });

          // Add small variant if available
          if (map.smallOption) {
            processedMaps.push({
              _id: map._id,
              variant: "small",
              name: `${map.name} (Small)`,
              image: `/maps/map_${map.name
                .toLowerCase()
                .replace(/\s+/g, "")}.png`,
              gameMode: map.gameMode || "Standard",
              isSmallVariant: true,
              smallOption: false,
              originalId: map._id,
            });
          }
        });

        setMaps(processedMaps);
      } catch (error) {
        console.error("Error fetching maps:", error);
        toast({
          title: "Error",
          description: "Failed to load maps",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchMaps();
    }
  }, [open]);

  // Handle map selection
  const handleMapSelect = (map: any) => {
    if (selectedMaps.some((m) => m.id === map._id)) {
      setSelectedMaps(selectedMaps.filter((m) => m.id !== map._id));
    } else {
      if (selectedMaps.length < 3) {
        // Make sure to include the gameMode
        setSelectedMaps([
          ...selectedMaps,
          {
            id: map._id,
            name: map.name,
            isSmallVariant: map.isSmallVariant,
            image: map.image,
            gameMode: map.gameMode,
          },
        ]);

        console.log("Selected map with gameMode:", {
          id: map._id,
          name: map.name,
          gameMode: map.gameMode,
        });
      }
    }
  };

  // Handle suggested time selection
  const handleSuggestedTimeSelection = (option: "tomorrow" | "weekend") => {
    if (option === "tomorrow") {
      setDate(tomorrow);
    } else {
      setDate(weekend);
    }
    setTimeOption("evening");
  };

  // Handle standard map selection
  const handleStandardMapSelection = () => {
    // Find the standard maps: Nerve Center (Small), Lobby (Small), and Power Station
    const nerveCenterSmall = maps.find(
      (map) => map.name === "Nerve Center (Small)"
    );
    const lobbySmall = maps.find((map) => map.name === "Lobby (Small)");
    const powerStation = maps.find(
      (map) => map.name === "Power Station" && !map.isSmallVariant
    );

    if (nerveCenterSmall && lobbySmall && powerStation) {
      setSelectedMaps([
        {
          id: nerveCenterSmall._id,
          name: nerveCenterSmall.name,
          isSmallVariant: true,
          image: nerveCenterSmall.image,
          gameMode: "",
        },
        {
          id: lobbySmall._id,
          name: lobbySmall.name,
          isSmallVariant: true,
          image: lobbySmall.image,
          gameMode: "",
        },
        {
          id: powerStation._id,
          name: powerStation.name,
          isSmallVariant: false,
          image: powerStation.image,
          gameMode: "",
        },
      ]);
      setMapSelectionMethod("standard");
    } else {
      toast({
        title: "Standard maps not found",
        description:
          "Some standard maps could not be found. Please select maps manually.",
        variant: "default",
      });
    }
  };

  // Handle randomizing map selection
  const handleRandomizeMapSelection = () => {
    if (maps.length < 3) {
      toast({
        title: "Not enough maps",
        description: "There are not enough maps to randomize selection.",
        variant: "destructive",
      });
      return;
    }

    // Shuffle maps and pick 3
    const shuffled = [...maps].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    setSelectedMaps(
      selected.map((map) => ({
        id: map._id,
        name: map.name,
        isSmallVariant: map.isSmallVariant,
        gameMode: map.gameMode,
        image: map.image,
      }))
    );
    setMapSelectionMethod("random");
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!date) {
        toast({
          title: "Error",
          description: "Please select a date for the scrimmage",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (selectedMaps.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one map",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Format the selected maps to include gameMode
      const formattedMaps = selectedMaps.map((map) => ({
        id: map.id,
        name: map.name,
        isSmallVariant: map.isSmallVariant,
        image: map.image,
        gameMode: map.gameMode,
      }));

      // Combine date and time based on timeOption
      let hours = 19; // Default to 7pm (evening)
      let minutes = 0;

      if (timeOption === "morning") {
        hours = 10;
      } else if (timeOption === "afternoon") {
        hours = 14;
      } else if (timeOption === "evening") {
        hours = 19;
      } else if (timeOption === "custom") {
        const [h, m] = customTime.split(":").map(Number);
        hours = h;
        minutes = m;
      }

      // Create a date object with the selected date at midnight in user's local timezone
      // We need to create a new date to avoid mutating the original
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      // Create a new Date object with the selected date and time in user's local timezone
      // This ensures the time is set correctly in the local timezone before UTC conversion
      const localDateTime = new Date(year, month, day, hours, minutes, 0, 0);

      // Convert to UTC ISO string for storage
      // toISOString() automatically converts from local timezone to UTC
      const utcISOString = localDateTime.toISOString();

      const response = await fetch("/api/scrimmages/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengedTeamId: team._id,
          proposedDate: utcISOString,
          selectedMaps: formattedMaps,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send challenge");
      }

      setOpen(false);
      toast({
        title: "Challenge sent",
        description: `Your challenge has been sent to ${team.name}.`,
      });
    } catch (error: any) {
      console.error("Error sending challenge:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send challenge",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog opening separately
  const handleOpenDialog = () => {
    if (canChallenge) {
      setOpen(true);
    }
  };

  // Create a standalone button that doesn't interfere with DialogTrigger
  const ChallengeButton = () => (
    <Button
      size="sm"
      className="h-8 transition duration-200 ease-in-out transform hover:bg-gray-200 hover:scale-105 active:scale-95"
      onClick={handleOpenDialog}
      disabled={!canChallenge}
    >
      <Swords className="mr-2 w-5 h-5" />
      Challenge
    </Button>
  );

  return (
    <>
      {/* Tooltip for disabled button */}
      {!canChallenge && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                {" "}
                {/* Use span to avoid nesting issues */}
                <Button
                  size="sm"
                  className="h-8 transition duration-200 ease-in-out transform hover:bg-gray-200 hover:scale-105 active:scale-95"
                  disabled={true}
                >
                  <Swords className="mr-2 w-5 h-5" />
                  Challenge
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Team needs at least 4 members to be challenged</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Show button without tooltip if team can be challenged */}
      {canChallenge && (
        <Button
          size="sm"
          className="h-8 transition duration-200 ease-in-out transform hover:bg-gray-200 hover:scale-105 active:scale-95"
          onClick={() => setOpen(true)}
        >
          <Swords className="mr-2 w-5 h-5" />
          Challenge
        </Button>
      )}

      {/* Dialog without trigger (manually controlled) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex gap-3 items-center">
              <div className="relative p-2 bg-gradient-to-br rounded-lg border from-primary/20 to-primary/10 border-primary/30">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg sm:text-xl">
                  Challenge {team.name}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs sm:text-sm">
                  Set up a scrimmage match with {team.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-4 sm:mt-6"
          >
            <TabsList className="grid grid-cols-2 w-full h-10">
              <TabsTrigger value="details" className="text-xs sm:text-sm">
                Match Details
              </TabsTrigger>
              <TabsTrigger value="maps" className="text-xs sm:text-sm">
                Map Selection
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="pt-4 space-y-5 sm:pt-6 sm:space-y-6"
            >
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                    <Clock className="w-4 h-4 text-primary" />
                    Suggested Times
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      className="justify-start h-11 border-2 transition-colors hover:border-primary/50"
                      onClick={() => handleSuggestedTimeSelection("tomorrow")}
                    >
                      <Clock className="mr-2 w-4 h-4" />
                      <span className="text-xs sm:text-sm">
                        Tomorrow Evening
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="justify-start h-11 border-2 transition-colors hover:border-primary/50"
                      onClick={() => handleSuggestedTimeSelection("weekend")}
                    >
                      <span className="text-xs sm:text-sm">This Weekend</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Custom Date & Time
                  </h3>
                  <div className="grid gap-3">
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal h-11 border-2",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 w-4 h-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(date) => {
                            setDate(date);
                            setCalendarOpen(false);
                          }}
                          initialFocus
                          disabled={(date) => {
                            // Get start of today
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            // Disable dates before today, but allow today
                            return date < today;
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="grid gap-3">
                      <Select
                        value={timeOption}
                        onValueChange={setTimeOption}
                        disabled={!date}
                      >
                        <SelectTrigger className="h-11 border-2">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">
                            Morning (10:00 AM)
                          </SelectItem>
                          <SelectItem value="afternoon">
                            Afternoon (2:00 PM)
                          </SelectItem>
                          <SelectItem value="evening">
                            Evening (7:00 PM)
                          </SelectItem>
                          <SelectItem value="custom">Custom time</SelectItem>
                        </SelectContent>
                      </Select>

                      {timeOption === "custom" && (
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="custom-time" className="sr-only">
                            Custom time
                          </Label>
                          <input
                            type="time"
                            id="custom-time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="flex px-3 py-2 w-full h-11 text-sm rounded-md border-2 border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Your local timezone:{" "}
                        <span className="font-medium">
                          {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                    <Trophy className="w-4 h-4 text-primary" />
                    Match Format
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col justify-center items-center p-3 bg-gradient-to-br rounded-lg border-2 transition-all sm:p-4 from-muted/50 to-muted/30 hover:border-primary/30">
                      <div className="relative p-2 mb-2 rounded-lg bg-primary/10">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold sm:text-sm">
                        Best of 3
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Maps
                      </span>
                    </div>
                    <div className="flex flex-col justify-center items-center p-3 bg-gradient-to-br rounded-lg border-2 transition-all sm:p-4 from-muted/50 to-muted/30 hover:border-primary/30">
                      <div className="relative p-2 mb-2 rounded-lg bg-primary/10">
                        <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold sm:text-sm">
                        First to 6
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Rounds
                      </span>
                    </div>
                    <div className="flex flex-col justify-center items-center p-3 bg-gradient-to-br rounded-lg border-2 sm:p-4 from-primary/10 to-primary/5 border-primary/30">
                      <div className="relative p-2 mb-2 rounded-lg bg-primary/20">
                        <Map className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold sm:text-sm">
                        {selectedMaps.length} maps
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Selected
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    Message to Team{" "}
                    <span className="font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  </h3>
                  <Textarea
                    placeholder="Add a message to the team you're challenging..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px] border-2 resize-none focus:border-primary/50 transition-colors"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {message.length}/500 characters
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 pt-4 border-t sm:flex-row border-border/50">
                <Button
                  onClick={() => setActiveTab("maps")}
                  disabled={!date}
                  className="flex-1 w-full h-11 sm:w-auto"
                >
                  Next: Select Maps
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent
              value="maps"
              className="pt-4 space-y-5 sm:pt-6 sm:space-y-6"
            >
              <div className="space-y-5 sm:space-y-6">
                <div className="flex flex-col gap-3">
                  <h3 className="flex gap-2 items-center text-sm font-semibold">
                    <MapPin className="w-4 h-4 text-primary" />
                    Map Selection
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={
                        mapSelectionMethod === "standard"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={handleStandardMapSelection}
                      disabled={loading}
                    >
                      Standard
                    </Button>
                    <Button
                      variant={
                        mapSelectionMethod === "manual" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setMapSelectionMethod("manual")}
                      disabled={loading}
                    >
                      Manual
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg border bg-muted/50 border-border/50">
                  <span className="text-sm font-medium">Selected Maps:</span>
                  <Badge
                    variant={
                      selectedMaps.length === 3 ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {selectedMaps.length}/3
                  </Badge>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {maps.map((map) => (
                      <div
                        key={map._id + (map.isSmallVariant ? ":small" : "")}
                        onClick={() => handleMapSelect(map)}
                        className={cn(
                          "relative flex flex-col items-center border rounded-md overflow-hidden cursor-pointer transition-all",
                          selectedMaps.some(
                            (m) =>
                              m.id === map._id &&
                              m.isSmallVariant === map.isSmallVariant
                          )
                            ? "border-primary ring-2 ring-primary ring-opacity-50"
                            : "hover:border-primary/50"
                        )}
                      >
                        <div className="relative w-full aspect-square bg-black/40">
                          {map.image ? (
                            <Image
                              src={map.image}
                              alt={map.name}
                              className="object-cover w-full h-full"
                              width={100}
                              height={100}
                            />
                          ) : (
                            <div className="flex justify-center items-center w-full h-full bg-muted">
                              <MapPin className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          {selectedMaps.some(
                            (m) =>
                              m.id === map._id &&
                              m.isSmallVariant === map.isSmallVariant
                          ) && (
                            <div className="flex absolute inset-0 justify-center items-center bg-primary/20">
                              <Check className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 w-full text-center">
                          <p className="h-10 text-sm font-medium line-clamp-2">
                            {map.name}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {map.gameMode}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleRandomizeMapSelection}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  <svg
                    className="mr-2 w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 4L14 8H17C17 12.4183 13.4183 16 9 16H7M6 20L10 16H7C7 11.5817 10.5817 8 15 8H17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Randomize Map Selection
                </Button>
              </div>

              <DialogFooter className="flex flex-col gap-2 pt-4 border-t sm:flex-row border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("details")}
                  className="flex-1 w-full h-11 sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !date ||
                    selectedMaps.length !== 3 ||
                    !isTeamCaptain ||
                    isSubmitting
                  }
                  className="flex-1 w-full h-11 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Challenge"
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>

          {!isTeamCaptain && (
            <div className="p-3 mt-4 text-sm rounded-lg border bg-destructive/10 border-destructive/20 text-destructive">
              Only team captains can send challenges.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
