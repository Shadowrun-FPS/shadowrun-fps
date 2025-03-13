import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";

interface ScoreFormValues {
  mapIndex: number;
  team1Score: number;
  team2Score: number;
  submittingTeam: number | null;
}

interface ScoreFormProps {
  mapIndex: number;
  mapName: string;
  hasDiscrepancy: boolean;
  onSubmit: (values: ScoreFormValues) => void;
  isSubmitting: boolean;
}

export function ScoreForm({
  mapIndex,
  mapName,
  hasDiscrepancy,
  onSubmit,
  isSubmitting,
}: ScoreFormProps) {
  // Add form implementation
  const form = useForm<ScoreFormValues>({
    defaultValues: {
      mapIndex,
      team1Score: 0,
      team2Score: 0,
      submittingTeam: null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {hasDiscrepancy && (
          <div className="mb-4 p-3 border border-red-500 bg-red-900/20 rounded-md">
            <p className="flex items-center text-red-400">
              <AlertCircle className="mr-2 h-4 w-4" />
              Scores did not match. Please resubmit scores for this map.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="team1Score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team 1 Score</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="team2Score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team 2 Score</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <input
            type="hidden"
            {...form.register("mapIndex")}
            value={mapIndex}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`mt-4 w-full ${
            hasDiscrepancy ? "bg-red-600 hover:bg-red-700" : ""
          }`}
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : hasDiscrepancy ? (
            <>Resubmit Score</>
          ) : (
            <>Submit Score</>
          )}
        </Button>
      </form>
    </Form>
  );
}
