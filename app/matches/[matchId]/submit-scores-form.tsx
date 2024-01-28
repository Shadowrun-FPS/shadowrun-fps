"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ControllerRenderProps } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Field = ControllerRenderProps<any, any>;

const TeamScoreSchema = z.object({
  rounds: z.coerce.number(),
  team: z
    .union([z.literal("RNA"), z.literal("Lineage")])
    .refine((value) => value !== undefined, {
      message: "Team is required",
    }),
});

export const formSchema = z.object({
  team1: TeamScoreSchema,
  team2: TeamScoreSchema,
});

export function SubmitScoresForm({
  index,
  handleClose,
}: {
  index: number;
  handleClose: () => void;
}) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const params = useParams<{ matchId: string }>();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team1: {
        rounds: 0,
        team: undefined,
      },
      team2: {
        rounds: 0,
        team: undefined,
      },
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const matchId = params.matchId;
    if (!userName) {
      return console.error("No user name");
    }
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("Cannot submit. Form has errors ", form.formState.errors);
      return;
    }
    // SUCCESS path
    await handleSubmit(matchId, index, userName, values);
    toast({
      title: "Map results submitted successfully",
      description: (
        <>
          <p>
            <strong>Team 1:</strong> {values.team1.team} {values.team1.rounds}{" "}
            rounds.
          </p>
          <p>
            <strong>Team 2:</strong> {values.team2.team} {values.team2.rounds}{" "}
            rounds.
          </p>
          <p>
            <strong>Submitted by:</strong> {userName}
          </p>
        </>
      ),
    });
    handleClose();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="team1.rounds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team 1 Rounds</FormLabel>
              <FormControl>
                <Input type="number" {...field} min={0} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="team2.rounds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team 2 Rounds</FormLabel>
              <FormControl>
                <Input type="number" {...field} min={0} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="team1.team"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team 1</FormLabel>
              <FormControl>
                <TeamSelect field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="team2.team"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team 2</FormLabel>
              <FormControl>
                <TeamSelect field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button variant="default" type="submit">
          Submit
        </Button>
      </form>
    </Form>
  );
}

function TeamSelect({ field }: { field: Field }) {
  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger className="w-[320px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="RNA">RNA</SelectItem>
        <SelectItem value="Lineage">Lineage</SelectItem>
      </SelectContent>
    </Select>
  );
}
