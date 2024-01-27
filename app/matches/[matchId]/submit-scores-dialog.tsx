"use client";
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
import { SubmitScoresForm } from "./submit-scores-form";
import { useSession } from "next-auth/react";

export default function SubmitScoresDialog({ index }: { index: number }) {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!isSignedIn}>
          {isSignedIn ? "Submit Scores" : "Login to Submit Scores"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit the results of a map</DialogTitle>
          <DialogDescription>
            You can submit the scores of a map here.
          </DialogDescription>
          <SubmitScoresForm index={index} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
