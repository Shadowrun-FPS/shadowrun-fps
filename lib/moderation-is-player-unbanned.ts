import type { AdminModerationLog } from "@/types/moderation-log";

/** Whether a ban row is no longer active (API flag or a later unban log). */
export function isPlayerUnbanned(
  logs: AdminModerationLog[],
  playerId: string,
  action: AdminModerationLog,
): boolean {
  if (action.action === "ban" && typeof action.banIsActive === "boolean") {
    return !action.banIsActive;
  }
  return logs.some(
    (log) =>
      log.action === "unban" &&
      log.playerId === playerId &&
      new Date(log.timestamp) > new Date(action.timestamp),
  );
}
