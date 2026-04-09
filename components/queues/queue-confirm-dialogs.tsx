"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RemovePlayerPayload, DeleteQueuePayload } from "@/hooks/useQueueActions";

interface QueueConfirmDialogsProps {
  playerToRemove: RemovePlayerPayload | null;
  queueToDelete: DeleteQueuePayload | null;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

export function QueueConfirmDialogs({
  playerToRemove,
  queueToDelete,
  onCancelRemove,
  onConfirmRemove,
  onCancelDelete,
  onConfirmDelete,
}: QueueConfirmDialogsProps) {
  return (
    <>
      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => { if (!open) onCancelRemove(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {playerToRemove?.playerName} from the queue? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!queueToDelete} onOpenChange={(open) => { if (!open) onCancelDelete(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Queue</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {queueToDelete?.name ? `"${queueToDelete.name}"` : "this queue"}
              {queueToDelete?.teamSize != null ? ` (${queueToDelete.teamSize}v${queueToDelete.teamSize})` : ""}
              {queueToDelete?.eloTier?.trim() ? ` — tier tag: ${queueToDelete.eloTier}` : ""}
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
