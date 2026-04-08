/**
 * Shared tier styling for queue UIs (match queues, admin queue management).
 */
export const QUEUE_TIER_CONFIG = {
  low: {
    label: "LOW",
    className:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400",
  },
  mid: {
    label: "MID",
    className:
      "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:text-amber-400",
  },
  high: {
    label: "HIGH",
    className:
      "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:text-rose-400",
  },
} as const;

export type QueueTierKey = keyof typeof QUEUE_TIER_CONFIG;

export function getQueueTierChip(tier?: string | null): {
  label: string;
  className: string;
} | null {
  if (!tier?.trim()) return null;
  const key = tier.toLowerCase() as QueueTierKey;
  if (key in QUEUE_TIER_CONFIG) {
    return QUEUE_TIER_CONFIG[key];
  }
  return {
    label: tier.toUpperCase(),
    className:
      "bg-muted/40 text-muted-foreground border-border/40 dark:text-muted-foreground",
  };
}
