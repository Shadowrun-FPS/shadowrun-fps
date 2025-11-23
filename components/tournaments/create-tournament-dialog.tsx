"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, startOfHour, isToday, isTomorrow, isThisWeek } from "date-fns";
import {
  CalendarIcon,
  Trophy,
  Medal,
  Users,
  Clock,
  CalendarDays,
  Sparkles,
  Globe,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// Common timezones list
const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)", offset: "UTC-5" },
  { value: "America/Chicago", label: "Central Time (CT)", offset: "UTC-6" },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: "UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "UTC-8" },
  { value: "America/Phoenix", label: "Arizona Time (MST)", offset: "UTC-7" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", offset: "UTC-9" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", offset: "UTC-10" },
  { value: "Europe/London", label: "London (GMT)", offset: "UTC+0" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "UTC+1" },
  { value: "Europe/Berlin", label: "Berlin (CET)", offset: "UTC+1" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", offset: "UTC+3" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "UTC+9" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "UTC+8" },
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "UTC+4" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)", offset: "UTC+11" },
  { value: "Australia/Melbourne", label: "Melbourne (AEDT)", offset: "UTC+11" },
];

// Get user's timezone
const getUserTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = timezones.find((tzOption) => tzOption.value === tz);
    return found ? found.value : timezones[0].value;
  } catch {
    return timezones[0].value;
  }
};

// Form schema for tournament creation
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
  timezone: z.string().min(1, {
    message: "Timezone is required.",
  }),
});

// Simple label component for radio buttons
const Label = ({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) => (
  <label className={cn("cursor-pointer", className)} htmlFor={htmlFor}>
    {children}
  </label>
);

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTournamentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTournamentDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Set default values for the form
  const tomorrow = startOfHour(addDays(new Date(), 1));
  tomorrow.setMinutes(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      format: "single_elimination",
      teamSize: 4,
      maxTeams: 8,
      startDate: tomorrow,
      startTime: "18:00",
      timezone: getUserTimezone(),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);

    try {
      // Combine date and time in the selected timezone
      const [hours, minutes] = values.startTime.split(":").map(Number);
      
      // Create a date string in the format: YYYY-MM-DDTHH:mm
      const dateStr = format(values.startDate, "yyyy-MM-dd");
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      const dateTimeStr = `${dateStr}T${timeStr}`;
      
      // Create date object - the browser will interpret this in local time
      // We'll store both the local date and timezone for the backend to handle conversion
      const localDate = new Date(dateTimeStr);
      
      // Validate that the date is in the future
      if (localDate < new Date()) {
        toast({
          title: "Invalid Date/Time",
          description: "The tournament start time must be in the future.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Create the tournament payload
      const tournamentData = {
        name: values.name,
        description: values.description || "",
        format: values.format,
        teamSize: values.teamSize,
        maxTeams: values.maxTeams,
        startDate: localDate.toISOString(),
        timezone: values.timezone,
        status: "upcoming",
      };

      // Post to API
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tournamentData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Tournament Created",
          description: `${values.name} has been created successfully!`,
        });
        onOpenChange(false);
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create tournament. Please try again.",
          variant: "destructive",
        });
        console.error("Error creating tournament:", error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create tournament:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Format options for tournament format selection
  const formatOptions = [
    {
      id: "single_elimination",
      title: "Single Elimination",
      description: "Teams are eliminated after one loss",
      icon: Trophy,
      color: "from-yellow-500/20 to-amber-500/20",
      borderColor: "border-yellow-500/50",
      iconColor: "text-yellow-400",
    },
    {
      id: "double_elimination",
      title: "Double Elimination",
      description: "Teams are eliminated after two losses",
      icon: Medal,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/50",
      iconColor: "text-blue-400",
    },
  ];

  // Options for team size and max teams
  const teamSizeOptions = [1, 2, 3, 4, 5, 6];
  const maxTeamsOptions = [4, 8, 16, 32, 64];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <DialogHeader className="relative p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Create a Tournament
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  Set up your tournament details and customize settings
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Tournament Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Tournament Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Summer Championship 2023"
                        className="h-11"
                        {...field}
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
                        placeholder="Enter details about your tournament..."
                        className="min-h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Provide details about prizes, rules, and other information
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tournament Format */}
            <div className="space-y-3">
              <FormLabel className="text-sm font-semibold">
                Tournament Format
              </FormLabel>
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                      >
                        {formatOptions.map((option) => {
                          const IconComponent = option.icon;
                          const isSelected = field.value === option.id;
                          return (
                            <div key={option.id}>
                              <RadioGroupItem
                                value={option.id}
                                id={option.id}
                                className="sr-only"
                              />
                              <Label
                                htmlFor={option.id}
                                className={cn(
                                  "relative flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all cursor-pointer group",
                                  "bg-gradient-to-br",
                                  isSelected
                                    ? `${option.color} ${option.borderColor} border-2 shadow-lg scale-[1.02]`
                                    : "border-muted bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50"
                                )}
                              >
                                <div
                                  className={cn(
                                    "mb-3 p-3 rounded-full bg-background/50 border",
                                    isSelected
                                      ? `${option.borderColor} border-2`
                                      : "border-border"
                                  )}
                                >
                                  <IconComponent
                                    className={cn(
                                      "w-6 h-6",
                                      isSelected
                                        ? option.iconColor
                                        : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                  />
                                </div>
                                <div
                                  className={cn(
                                    "font-semibold mb-1",
                                    isSelected && "text-foreground"
                                  )}
                                >
                                  {option.title}
                                </div>
                                <div className="text-xs text-center text-muted-foreground">
                                  {option.description}
                                </div>
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  </div>
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Team Configuration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
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
                            {size}v{size}
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
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
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

            {/* Date & Time */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
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
                              <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
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
                      <FormDescription className="text-xs">
                        {field.value && (
                          <span className="text-muted-foreground">
                            {(() => {
                              const [hours, minutes] = field.value.split(":").map(Number);
                              const period = hours >= 12 ? "PM" : "AM";
                              const displayHours = hours % 12 || 12;
                              return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
                            })()}
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      Timezone
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select timezone">
                            {timezones.find((tz) => tz.value === field.value)?.label ||
                              "Select timezone"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{tz.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {tz.offset}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      {field.value && (
                        <span className="text-muted-foreground">
                          Selected: {timezones.find((tz) => tz.value === field.value)?.label} ({timezones.find((tz) => tz.value === field.value)?.offset})
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date/Time Preview */}
            {form.watch("startDate") && form.watch("startTime") && form.watch("timezone") && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">Tournament Start Time</p>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const date = form.watch("startDate");
                        const time = form.watch("startTime");
                        const tz = form.watch("timezone");
                        const tzLabel = timezones.find((t) => t.value === tz)?.label || tz;
                        const [hours, minutes] = time.split(":").map(Number);
                        const period = hours >= 12 ? "PM" : "AM";
                        const displayHours = hours % 12 || 12;
                        return `${format(date, "EEEE, MMMM d, yyyy")} at ${displayHours}:${minutes.toString().padStart(2, "0")} ${period} (${tzLabel})`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-initial"
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Tournament
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
