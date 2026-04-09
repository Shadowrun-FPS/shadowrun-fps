"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, PlusCircle } from "lucide-react";

const ELO_TIER_PRESETS = {
  low: { minElo: 0, maxElo: 1499 },
  mid: { minElo: 1500, maxElo: 2199 },
  high: { minElo: 2200, maxElo: 5000 },
} as const;

const TIER_NONE = "__none__" as const;

const schema = z
  .object({
    teamSize: z.enum(["1", "2", "4", "5", "8"]),
    eloTier: z.enum(["low", "mid", "high", TIER_NONE]),
    minElo: z.coerce.number().min(0).max(5000),
    maxElo: z.coerce.number().min(0).max(5000),
  })
  .refine((d) => d.minElo < d.maxElo, {
    message: "Min ELO must be less than max ELO",
    path: ["minElo"],
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  teamSize: "4",
  eloTier: TIER_NONE,
  minElo: ELO_TIER_PRESETS.mid.minElo,
  maxElo: ELO_TIER_PRESETS.mid.maxElo,
};

interface CreateQueueDialogProps {
  /** Only renders the trigger when true; the dialog still mounts. */
  visible: boolean;
}

export function CreateQueueDialog({ visible }: CreateQueueDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  if (!visible) return null;

  const onSubmit = async (values: FormValues) => {
    setIsCreating(true);
    try {
      const tier = values.eloTier !== TIER_NONE ? values.eloTier : undefined;
      const response = await fetch("/api/queues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamSize: parseInt(values.teamSize, 10),
          ...(tier ? { eloTier: tier } : {}),
          minElo: values.minElo,
          maxElo: values.maxElo,
          gameType: "ranked",
          status: "active",
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create queue");
      }
      toast({ title: "Queue Created", description: "The queue has been created successfully", duration: 3000 });
      setOpen(false);
      form.reset(DEFAULT_VALUES);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create queue",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) form.reset(DEFAULT_VALUES);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0 w-full sm:w-auto">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Create Queue</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Queue</DialogTitle>
          <DialogDescription>Configure a new ranked matchmaking queue</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
            <FormField
              control={form.control}
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Size</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(["1", "2", "4", "5", "8"] as const).map((s) => (
                        <SelectItem key={s} value={s}>{s}v{s}</SelectItem>
                      ))}
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
                  <FormLabel>ELO tier (optional)</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "low" || value === "mid" || value === "high") {
                        const preset = ELO_TIER_PRESETS[value];
                        form.setValue("minElo", preset.minElo);
                        form.setValue("maxElo", preset.maxElo);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TIER_NONE}>None</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Tier tag for pre-set min/max ELOs.</FormDescription>
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
                    <FormControl><Input type="number" {...field} /></FormControl>
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
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" />Create Queue</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
