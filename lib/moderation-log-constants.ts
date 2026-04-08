/**
 * Log actions that should appear only in staff/admin moderation views, not on the public moderation log.
 */
export const STAFF_ONLY_MODERATION_LOG_ACTIONS = [
  "queue_remove_player",
] as const;

export type StaffOnlyModerationLogAction =
  (typeof STAFF_ONLY_MODERATION_LOG_ACTIONS)[number];
