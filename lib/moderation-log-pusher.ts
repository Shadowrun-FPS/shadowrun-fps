import Pusher from "pusher";
import { safeLog } from "@/lib/security";
import {
  MODERATION_LOG_PUSHER_CHANNEL,
  MODERATION_LOG_PUSHER_EVENT,
} from "@/lib/moderation-log-realtime-constants";

let serverPusher: Pusher | null = null;

function getModerationPusher(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) {
    return null;
  }
  if (!serverPusher) {
    serverPusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }
  return serverPusher;
}

/**
 * Notify subscribers that moderation logs changed. No-op if Pusher env is missing.
 */
export function triggerModerationLogUpdate(): void {
  try {
    const pusher = getModerationPusher();
    if (!pusher) return;
    void pusher.trigger(
      MODERATION_LOG_PUSHER_CHANNEL,
      MODERATION_LOG_PUSHER_EVENT,
      {
        t: Date.now(),
      },
    );
  } catch (err) {
    safeLog.error("moderation-log Pusher trigger failed:", err);
  }
}
