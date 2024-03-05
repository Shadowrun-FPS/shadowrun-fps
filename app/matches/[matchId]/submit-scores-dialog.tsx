"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitScoresForm } from "./submit-scores-form";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function SubmitScoresDialog({
  index,
  team,
}: {
  index: number;
  team: string;
}) {
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  function handleClose() {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!isSignedIn}
          onClick={() => setOpen(true)}
        >
          {team}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit the results of a map</DialogTitle>
          <DialogDescription>
            You can submit the scores of a map here.
          </DialogDescription>
          <SubmitScoresForm index={index} handleClose={handleClose} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
