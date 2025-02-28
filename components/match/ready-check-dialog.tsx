"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ReadyCheckDialogProps {
  matchId: string;
  playerId: string;
  onReady: () => void;
  onCancel: () => void;
}

export function ReadyCheckDialog({
  matchId,
  playerId,
  onReady,
  onCancel,
}: ReadyCheckDialogProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      onCancel();
    }
  }, [timeLeft, onCancel]);

  const handleReady = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) throw new Error("Failed to ready up");

      onReady();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ready up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Match Ready!</DialogTitle>
          <DialogDescription>
            Please confirm that you are ready to start the match. Time
            remaining: {timeLeft}s
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleReady} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              "Ready"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
