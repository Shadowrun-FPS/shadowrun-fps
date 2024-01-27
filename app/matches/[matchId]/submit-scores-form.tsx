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
import { useToast } from "@/components/ui/use-toast";
import { DialogClose } from "@/components/ui/dialog";

export const formSchema = z.object({
  finalScores: z.object({
    team1: z.coerce.number(),
    team2: z.coerce.number(),
  }),
});

export function SubmitScoresForm({ index }: { index: number }) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const userName = session?.user?.name;
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
    if (userName === null || userName === undefined)
      return console.error("No user name");
    await handleSubmit(matchId, index, userName, values);
    toast({
      title: "Map results submitted successfully",
      description: (
        <>
          <p>
            <strong>Team 1:</strong> {values.finalScores.team1} rounds.
          </p>
          <p>
            <strong>Team 2:</strong> {values.finalScores.team2} rounds.
          </p>
          <p>
            <strong>Submitted by:</strong> {userName}
          </p>
        </>
      ),
    });
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
        <DialogClose asChild>
          <Button type="submit">Submit</Button>
        </DialogClose>
      </form>
    </Form>
  );
}
