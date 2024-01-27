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

export default async function SubmitScoresDialog({ index }: { index: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Submit Scores</Button>
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
