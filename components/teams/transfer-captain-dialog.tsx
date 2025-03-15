"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface TransferCaptainDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newCaptainName: string;
}

export function TransferCaptainDialog({
  isOpen,
  onClose,
  onConfirm,
  newCaptainName,
}: TransferCaptainDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Confirm Captain Transfer
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to transfer team captain to{" "}
            <strong>{newCaptainName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md text-amber-700 dark:text-amber-400 text-sm mt-2">
          <p className="font-medium">Warning: This action cannot be undone!</p>
          <p className="mt-1">
            You will lose all captain privileges and will not be able to reverse
            this transfer yourself. Only the new captain can transfer leadership
            back to you.
          </p>
        </div>
        <DialogFooter className="sm:justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="ml-2"
          >
            {isLoading ? "Transferring..." : "Transfer Captain Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
