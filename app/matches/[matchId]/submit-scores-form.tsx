"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { handleSubmit } from "./actions";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export const formSchema = z.object({
  finalScores: z.object({
    team1: z.number(),
    team2: z.number(),
  }),
});

export function SubmitScoresForm({ index }: { index: number }) {
  const { data } = useSession();
  console.log(data);
  const userName = data?.user?.name ?? "unknown";
  const params = useParams<{ matchId: string }>();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finalScores: {
        team1: 0,
        team2: 0,
      },
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const matchId = params.matchId;
    await handleSubmit(matchId, index, userName, values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="finalScores.team1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team 1 Score</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="finalScores.team2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team 2 Score</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
