"use client";

import { useState, useEffect } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import {
  CalendarIcon,
  CalendarDays,
  Clock,
  Trophy,
  Users,
  Globe,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { fromZonedTime } from "date-fns-tz";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// Common timezones for selection
const commonTimezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

// Helper to get timezone display label
function getTimezoneLabel(timezone: string | undefined): string {
  if (!timezone) return "Select a timezone";

  // Check if it's the local timezone
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone === localTz) {
    // Try to find a shorter name
    const found = commonTimezones.find((tz) => tz.value === timezone);
    if (found) {
      return `${found.label} (Local)`;
    }
    // Fallback: use a shortened version
    const parts = timezone.split("/");
    const city = parts[parts.length - 1]?.replace(/_/g, " ") || timezone;
    return `${city} (Local)`;
  }

  // Find in common timezones
  const found = commonTimezones.find((tz) => tz.value === timezone);
  if (found) {
    return found.label;
  }

  // Fallback: use last part of timezone
  const parts = timezone.split("/");
  return parts[parts.length - 1]?.replace(/_/g, " ") || timezone;
}

// Form schema for tournament editing
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Tournament name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  format: z.enum(["single_elimination", "double_elimination"]),
  teamSize: z.number().min(1).max(6),
  maxTeams: z.number().min(4).max(64),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in 24-hour format (HH:MM).",
  }),
  timezone: z.string().optional(),
  status: z.enum(["upcoming", "active", "completed"]),
  registrationDeadline: z.date().nullable().optional(),
});

const teamSizeOptions = [1, 2, 3, 4, 5, 6];
const maxTeamsOptions = [4, 8, 16, 32, 64];

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  teamSize: number;
  format: "single_elimination" | "double_elimination";
  status: "upcoming" | "active" | "completed";
  maxTeams?: number;
  registrationDeadline?: string;
}

export function EditTournamentDialog({
  tournament,
  open,
  onOpenChange,
  onSuccess,
}: {
  tournament: Tournament;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (tournament: any) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  // Extract time from date
  const getTimeFromDateString = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  // Helper function to safely parse a date
  const safeParseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;

    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date : null;
  };

  // Set form values from tournament
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tournament.name,
      description: tournament.description || "",
      format: tournament.format,
      teamSize: tournament.teamSize,
      maxTeams: tournament.maxTeams || 8,
      startDate: new Date(tournament.startDate),
      startTime: getTimeFromDateString(tournament.startDate),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: tournament.status,
      registrationDeadline: safeParseDate(tournament.registrationDeadline),
    },
  });

  // Update form when tournament changes
  useEffect(() => {
    if (tournament) {
      form.reset({
        name: tournament.name,
        description: tournament.description || "",
        format: tournament.format,
        teamSize: tournament.teamSize,
        maxTeams: tournament.maxTeams || 8,
        startDate: new Date(tournament.startDate),
        startTime: getTimeFromDateString(tournament.startDate),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: tournament.status,
        registrationDeadline: safeParseDate(tournament.registrationDeadline),
      });
    }
  }, [tournament, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);

    try {
      // Combine date and time, then convert to UTC based on timezone
      const localDateTime = new Date(
        `${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}:00`
      );

      // Convert to UTC if timezone is provided
      const startDate = values.timezone
        ? fromZonedTime(localDateTime, values.timezone)
        : localDateTime;

      const response = await fetch(`/api/tournaments/${tournament._id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          startDate: startDate.toISOString(),
          registrationDeadline: values.registrationDeadline
            ? values.registrationDeadline.toISOString()
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update tournament");
      }

      toast({
        title: "Success",
        description: "Tournament updated successfully",
      });

      // Close the dialog first
      onOpenChange(false);

      // Then call the success callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get local timezone to filter duplicates
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const filteredCommonTimezones = commonTimezones.filter(
    (tz) => tz.value !== localTimezone
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <DialogHeader className="pb-4 space-y-3 border-b">
          <div className="flex gap-3 items-center">
            <div className="p-2 rounded-lg border bg-primary/10 border-primary/20">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">
                Edit Tournament
              </DialogTitle>
              <DialogDescription className="mt-1">
                Update the details for this tournament.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    Tournament Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11"
                      placeholder="Enter tournament name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter tournament description..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional description of the tournament.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => {
                  const isLaunched = tournament.status !== "upcoming";
                  return (
                    <FormItem>
                      <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        Tournament Format
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLaunched}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11" disabled={isLaunched}>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single_elimination">
                            Single Elimination
                          </SelectItem>
                          <SelectItem value="double_elimination">
                            Double Elimination
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {isLaunched && (
                        <FormDescription className="text-xs text-amber-500">
                          Format cannot be changed after tournament is launched
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Team Size
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamSizeOptions.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} vs {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Number of players per team
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxTeams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Maximum Teams
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select max teams" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maxTeamsOptions.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} Teams
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Maximum number of teams that can register
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    Start Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-11 pl-3 text-left font-normal justify-start",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {isToday(field.value)
                                  ? "Today"
                                  : isTomorrow(field.value)
                                  ? "Tomorrow"
                                  : format(field.value, "EEEE, MMM d")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(field.value, "MMMM yyyy")}
                              </span>
                            </div>
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto w-4 h-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-xs">
                    {field.value && (
                      <span className="text-muted-foreground">
                        Selected: {format(field.value, "EEEE, MMMM d, yyyy")}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        placeholder="18:00"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    {field.value && (
                      <FormDescription className="text-xs">
                        Selected:{" "}
                        {format(
                          new Date(`2000-01-01T${field.value}:00`),
                          "h:mm a"
                        )}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      Timezone
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Your Local Timezone</SelectLabel>
                          <SelectItem
                            value={
                              Intl.DateTimeFormat().resolvedOptions().timeZone
                            }
                          >
                            {getTimezoneLabel(
                              Intl.DateTimeFormat().resolvedOptions().timeZone
                            )}
                          </SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Common Timezones</SelectLabel>
                          {filteredCommonTimezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      All times will be converted to UTC for storage.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Live Preview of Start Time */}
            {form.watch("startDate") &&
              form.watch("startTime") &&
              form.watch("timezone") && (
                <div className="p-4 rounded-lg border border-l-4 bg-muted/50 border-primary">
                  <div className="flex gap-3 items-center">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">
                        Tournament Start Time (Preview)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const timezone = form.watch("timezone");
                          if (!timezone) return "Please select a timezone";
                          try {
                            return format(
                              fromZonedTime(
                                new Date(
                                  `${format(
                                    form.watch("startDate"),
                                    "yyyy-MM-dd"
                                  )}T${form.watch("startTime")}:00`
                                ),
                                timezone
                              ),
                              "EEEE, MMMM d, yyyy 'at' h:mm a zzz"
                            );
                          } catch (error) {
                            return "Invalid date/time";
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <FormField
              control={form.control}
              name="registrationDeadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex gap-2 items-center text-sm font-semibold">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    Registration Deadline (Optional)
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-11 pl-3 text-left font-normal justify-start",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value &&
                          field.value instanceof Date &&
                          !isNaN(field.value.getTime()) ? (
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {isToday(field.value)
                                  ? "Today"
                                  : isTomorrow(field.value)
                                  ? "Tomorrow"
                                  : format(field.value, "EEEE, MMM d")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(field.value, "MMMM yyyy")}
                              </span>
                            </div>
                          ) : (
                            <span>No deadline set</span>
                          )}
                          <CalendarIcon className="ml-auto w-4 h-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto" align="start">
                      <div className="flex justify-between items-center p-2 border-b">
                        <span className="text-sm font-medium">
                          Select deadline
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                          className="h-8 text-xs"
                        >
                          <X className="mr-1 w-3 h-3" />
                          Clear
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={
                          field.value instanceof Date &&
                          !isNaN(field.value.getTime())
                            ? field.value
                            : undefined
                        }
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-xs">
                    Optional deadline for team registration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4 border-t sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Tournament"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
