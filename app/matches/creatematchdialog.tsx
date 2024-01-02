import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MatchForm } from "./matchform";

export default async function CreateMatchDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Match</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new match</DialogTitle>
          <DialogDescription>
            Using the settings provided below.
          </DialogDescription>
          <MatchForm />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
