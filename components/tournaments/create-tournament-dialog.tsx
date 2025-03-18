"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, startOfHour } from "date-fns";
import { CalendarIcon } from "lucide-react";
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

export function CreateTournamentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (tournament: any) => void;
}) {
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
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);

    try {
      // Combine date and time
      const startDate = new Date(values.startDate);
      const [hours, minutes] = values.startTime.split(":").map(Number);
      startDate.setHours(hours, minutes);

      // Create the tournament payload
      const tournamentData = {
        name: values.name,
        description: values.description || "",
        format: values.format,
        teamSize: values.teamSize,
        maxTeams: values.maxTeams,
        startDate: startDate.toISOString(),
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
        onOpenChange(false);
        form.reset();
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        const error = await response.json();
        console.error("Error creating tournament:", error);
      }
    } catch (error) {
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
      icon: "🏆",
    },
    {
      id: "double_elimination",
      title: "Double Elimination",
      description: "Teams are eliminated after two losses",
      icon: "🥇",
    },
  ];

  // Options for team size and max teams
  const teamSizeOptions = [1, 2, 3, 4, 5, 6];
  const maxTeamsOptions = [4, 8, 16, 32, 64];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Tournament</DialogTitle>
          <DialogDescription>
            Set up your tournament details and customize settings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Tournament Information */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Championship 2023" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter details about your tournament..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about prizes, rules, and other information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Format</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                      {formatOptions.map((option) => (
                        <div key={option.id}>
                          <RadioGroupItem
                            value={option.id}
                            id={option.id}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={option.id}
                            className={cn(
                              "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground",
                              field.value === option.id && "border-primary"
                            )}
                          >
                            <div className="mb-2 text-2xl">{option.icon}</div>
                            <div className="font-semibold">{option.title}</div>
                            <div className="text-xs text-center text-muted-foreground">
                              {option.description}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Size</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormDescription>
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
                    <FormLabel>Maximum Teams</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormDescription>
                      Maximum number of teams that can register
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" placeholder="18:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Tournament"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
