"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { handleSubmit } from "./actions";

const formSchema = z.object({
  gameType: z.enum(["ranked", "casual", "public"]),
  teamSize: z.number().array(),
  eloTier: z.enum(["low", "medium", "high"]),
  anonymous: z.boolean(),
});

export function MatchForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameType: "ranked",
      teamSize: [2],
      eloTier: "medium",
      anonymous: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("onSubmit form", values);
    await handleSubmit(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="gameType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Type</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Game Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ranked">Ranked</SelectItem>
                    <SelectItem value="casual" disabled>
                      Casual
                    </SelectItem>
                    <SelectItem value="public" disabled>
                      Public
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Only ranked is available for now.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Only show this when the game is ranked*/}
        <FormField
          control={form.control}
          name="eloTier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allowed Elo Tiers</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-[320px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (0-1600)</SelectItem>
                    <SelectItem value="medium">Medium (1200-1800)</SelectItem>
                    <SelectItem value="high">High (1400-3000)</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Players within the elo range specified will be able to join.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teamSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Size</FormLabel>
              <FormControl>
                <Slider
                  onChange={field.onChange}
                  defaultValue={field.value}
                  max={5}
                  min={1}
                  step={1}
                />
              </FormControl>
              <FormDescription>
                <div className="flex justify-between p-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </div>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="anonymous"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center p-4 space-x-3 space-y-0 border rounded-md shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Anonymous Mode</FormLabel>
                <FormDescription>
                  Choose whether or not player names are visible.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
