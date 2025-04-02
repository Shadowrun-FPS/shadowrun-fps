"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Shield,
  Check,
  X,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";

// First, define an interface for the scrimmage object
interface Scrimmage {
  _id: string;
  challengerTeam: {
    name: string;
    tag?: string;
  };
  challengedTeam: {
    name: string;
    tag?: string;
  };
  proposedDate: string | Date;
  selectedMaps: any[];
  message?: string;
  status: string;
}

export function RespondToChallengeDialog({
  scrimmage,
  open,
  onOpenChange,
  onResponseSuccess,
  userTeam,
  challengerTeam,
  challengedTeam,
  maps,
}: {
  scrimmage: Scrimmage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResponseSuccess: () => void;
  userTeam: any;
  challengerTeam: any;
  challengedTeam: any;
  maps: any[];
}) {
  const { data: session } = useSession();
  const [response, setResponse] = useState<
    "accept" | "reject" | "counter" | null
  >(null);
  const [counterDate, setCounterDate] = useState<Date | null>(null);
  const [counterTime, setCounterTime] = useState("19:00");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert selected map IDs to actual map objects
  const selectedMaps = scrimmage.selectedMaps.map((selectedMap) => {
    // Find the base map
    const baseMapId = selectedMap.isSmallVariant
      ? selectedMap.mapId.toString()
      : selectedMap.mapId.toString();

    const map = maps.find((m) => m._id.toString() === baseMapId);

    if (!map) return { name: "Unknown Map" };

    return {
      ...map,
      name: selectedMap.isSmallVariant ? `${map.name} (Small)` : map.name,
    };
  });

  // Generate time options in half-hour increments
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, "0")}:00`);
    timeOptions.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  // Check if user is captain of the challenged team
  const isTeamCaptain =
    userTeam?._id === challengedTeam?._id &&
    challengedTeam?.captain === session?.user?.id;

  const handleSubmit = async () => {
    if (!response || (response === "counter" && !counterDate)) return;

    try {
      setIsSubmitting(true);

      let requestBody: any = {
        response: response,
        message: message.trim() || undefined,
      };

      if (response === "counter" && counterDate) {
        const proposedDate = new Date(counterDate);
        const [hours, minutes] = counterTime.split(":").map(Number);
        proposedDate.setHours(hours, minutes);

        requestBody.counterProposedDate = proposedDate.toISOString();
      }

      const apiResponse = await fetch(
        `/api/scrimmages/${scrimmage._id}/respond`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        throw new Error(error.message || "Failed to respond to challenge");
      }

      const responseText =
        response === "accept"
          ? "accepted"
          : response === "reject"
          ? "rejected"
          : "sent a counter-proposal for";

      toast({
        title: "Response Sent",
        description: `You have ${responseText} the challenge from ${challengerTeam?.name}.`,
      });

      if (onResponseSuccess) {
        onResponseSuccess();
      }

      // Reset form
      setResponse(null);
      setCounterDate(null);
      setCounterTime("19:00");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error responding to challenge:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to respond to challenge",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scrimmage Challenge</DialogTitle>
          <DialogDescription>
            {challengerTeam?.name} has challenged your team to a scrimmage
            match.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Challenge details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Proposed Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(scrimmage.proposedDate), "PPP 'at' h:mm a")}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Selected Maps</p>
              <div className="grid grid-cols-3 gap-2">
                {selectedMaps.map((map, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-2 text-center border rounded-md"
                  >
                    <MapPin className="w-4 h-4 mb-1 text-primary" />
                    <span className="text-xs">{map.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted">
              <p className="mb-1 text-sm font-medium">Match Format</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center">
                  <Shield className="w-3 h-3 mr-2 text-primary" />
                  <span>Best of 3 Maps</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-2 text-primary" />
                  <span>First to 6 rounds per map</span>
                </div>
              </div>
            </div>

            {scrimmage.message && (
              <div className="p-3 border rounded-md">
                <p className="mb-1 text-sm font-medium">
                  Message from {challengerTeam?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {scrimmage.message}
                </p>
              </div>
            )}
          </div>

          {/* Response options */}
          {isTeamCaptain && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={response === "accept" ? "default" : "outline"}
                  onClick={() => setResponse("accept")}
                  className="flex flex-col h-auto py-4"
                >
                  <Check className="w-5 h-5 mb-1" />
                  <span>Accept</span>
                </Button>
                <Button
                  variant={response === "counter" ? "default" : "outline"}
                  onClick={() => setResponse("counter")}
                  className="flex flex-col h-auto py-4"
                >
                  <CalendarIcon className="w-5 h-5 mb-1" />
                  <span>Counter</span>
                </Button>
                <Button
                  variant={response === "reject" ? "destructive" : "outline"}
                  onClick={() => setResponse("reject")}
                  className="flex flex-col h-auto py-4"
                >
                  <X className="w-5 h-5 mb-1" />
                  <span>Decline</span>
                </Button>
              </div>

              {response === "counter" && (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label>Proposed Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !counterDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {counterDate ? (
                            format(counterDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={counterDate || undefined}
                          onSelect={(date) => setCounterDate(date || null)}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label>Proposed Time</Label>
                    <Select value={counterTime} onValueChange={setCounterTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((timeOption) => (
                          <SelectItem key={timeOption} value={timeOption}>
                            {timeOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Message (Optional)</Label>
                <Textarea
                  placeholder="Add a message about your response..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {isTeamCaptain ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !response ||
                  (response === "counter" && !counterDate) ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Response"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>

        {!isTeamCaptain && userTeam?._id === challengedTeam?._id && (
          <div className="p-2 mt-2 text-sm rounded-md bg-muted">
            Only your team captain can respond to this challenge.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
