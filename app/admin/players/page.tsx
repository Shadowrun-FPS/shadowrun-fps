"use client";

import { useState } from "react";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PlayerList } from "@/components/player-list";

export default function PlayersPage() {
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [rule, setRule] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const handleActionComplete = () => {
    // Handle action completion
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      setReasonError("Reason is required");
      return;
    }
    // Submit warning
  };

  return (
    <div className="container py-6 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Players</h1>
      </div>

      <PlayerList />

      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        onComplete={handleActionComplete}
      />

      <Dialog
        open={warnDialogOpen}
        onOpenChange={(open) => setWarnDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Issue Warning
            </DialogTitle>
            <DialogDescription>
              Issue a warning to this player for violating the rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rule">Rule Violated</Label>
              <Select value={rule} onValueChange={setRule}>
                <SelectTrigger id="rule">
                  <SelectValue placeholder="Select a rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="offensive">Offensive Content</SelectItem>
                  <SelectItem value="cheating">Cheating</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this action is being taken..."
                className="h-24 resize-none"
                required
              />
              {reasonError && (
                <p className="text-sm text-red-500">{reasonError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWarnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Issue Warning</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
