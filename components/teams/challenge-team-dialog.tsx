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

export function ChallengeTeamDialog({
  team,
  userTeam,
}: {
  team: Team;
  userTeam: Team;
}) {
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

      console.log("Sending challenge with data:", {
        challengedTeamId: team._id,
        proposedDate: date.toISOString(),
        selectedMaps: formattedMaps,
        message,
      });

      const response = await fetch("/api/scrimmages/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengedTeamId: team._id,
          proposedDate: date.toISOString(),
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
      <Swords className="w-5 h-5 mr-2" />
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
                  <Swords className="w-5 h-5 mr-2" />
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
          <Swords className="w-5 h-5 mr-2" />
          Challenge
        </Button>
      )}

      {/* Dialog without trigger (manually controlled) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Challenge {team.name}
            </DialogTitle>
            <DialogDescription>
              Set up a scrimmage match with {team.name}.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Match Details</TabsTrigger>
              <TabsTrigger value="maps">Map Selection</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="pt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-medium">Suggested Times</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      className="justify-start"
                      onClick={() => handleSuggestedTimeSelection("tomorrow")}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Tomorrow Evening
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="justify-start"
                      onClick={() => handleSuggestedTimeSelection("weekend")}
                    >
                      This Weekend
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Custom Date & Time</h3>
                  <div className="grid gap-2">
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(date) => {
                            setDate(date);
                            setCalendarOpen(false);
                          }}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="grid gap-2">
                      <Select
                        value={timeOption}
                        onValueChange={setTimeOption}
                        disabled={!date}
                      >
                        <SelectTrigger>
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
                            className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Your local timezone:{" "}
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Match Format</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-muted/50">
                      <Trophy className="w-5 h-5 mb-1 text-primary" />
                      <span className="text-sm">Best of 3</span>
                      <span className="text-xs text-muted-foreground">
                        Maps
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-muted/50">
                      <Timer className="w-5 h-5 mb-1 text-primary" />
                      <span className="text-sm">First to 6</span>
                      <span className="text-xs text-muted-foreground">
                        Rounds
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-muted/50">
                      <Map className="w-5 h-5 mb-1 text-primary" />
                      <span className="text-sm">3 maps</span>
                      <span className="text-xs text-muted-foreground">
                        Selected
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-medium">
                    Message to Team (Optional)
                  </h3>
                  <Textarea
                    placeholder="Add a message to the team you're challenging..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => setActiveTab("maps")}
                  disabled={!date}
                  className="flex-1"
                >
                  Next: Select Maps
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="maps" className="pt-4 space-y-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Map Selection</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
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

                <div className="mb-2 text-sm">
                  <span className="font-medium">Selected:</span>{" "}
                  {selectedMaps.length}/3 maps
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
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
                            <div className="flex items-center justify-center w-full h-full bg-muted">
                              <MapPin className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          {selectedMaps.some(
                            (m) =>
                              m.id === map._id &&
                              m.isSmallVariant === map.isSmallVariant
                          ) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <Check className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="w-full p-2 text-center">
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
                    className="w-4 h-4 mr-2"
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

              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("details")}
                  className="flex-1"
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
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
            <div className="p-2 mt-2 text-sm rounded-md bg-destructive/10 text-destructive">
              Only team captains can send challenges.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
