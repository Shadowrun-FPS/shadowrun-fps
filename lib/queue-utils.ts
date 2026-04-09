import { formatDistance } from "date-fns";
import { safeLog } from "@/lib/security";
import type { QueuePlayer, RuntimeQueue } from "@/types/admin-queue";

export const QUEUE_SIZES = ["1v1", "2v2", "4v4", "5v5", "8v8"] as const;
export type QueueSizeLabel = (typeof QUEUE_SIZES)[number];

export function getQueueSections(queue: RuntimeQueue) {
  const requiredPlayers = queue.teamSize * 2;
  const sorted = [...queue.players].sort((a, b) => a.joinedAt - b.joinedAt);
  return {
    activePlayers: sorted.slice(0, requiredPlayers),
    waitlistPlayers: sorted.slice(requiredPlayers),
  };
}

export function formatJoinTime(joinedAt: string | number | Date): string {
  try {
    const date =
      typeof joinedAt === "number" ? new Date(joinedAt) : new Date(joinedAt);
    if (isNaN(date.getTime())) return "just now";
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    safeLog.error("Error formatting date:", error);
    return "just now";
  }
}

export function isPlayerInQueue(queue: RuntimeQueue, userId: string): boolean {
  return queue.players.some((p: QueuePlayer) => p.discordId === userId);
}

export function hasRequiredPlayers(queue: RuntimeQueue): boolean {
  return getQueueSections(queue).activePlayers.length >= queue.teamSize * 2;
}

/** Parse the numeric team size from a tab label like "4v4" → 4 */
export function tabLabelToTeamSize(label: string): number {
  return parseInt(label.charAt(0), 10);
}
